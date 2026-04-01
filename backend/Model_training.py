#!/usr/bin/env python
# coding: utf-8

# ### ***AI  Based Crop Recommendation and Soil Condition Prediction***

# ##### ***Pre-Processing Data***

# In[25]:


import numpy as np
import pandas as pd


# ###### *Reading Crops Data of State Jharkhand collected from various platforms*

# In[26]:


crop_data = pd.read_csv("jharkhand_crop_dataset.csv")


# In[27]:


crop_data.head(5)


# In[28]:


crop_data.info()


# ###### *No need of cleaning already, data is cleaned*

# In[29]:


crop_data.describe()


# In[30]:


crop_data = crop_data.drop(columns=['District'])


# In[31]:


crops_data_num = crop_data.select_dtypes(include=np.number)


# In[32]:


import seaborn as sns
sns.heatmap(crops_data_num.corr(), annot=True)


# #### ***Supervised Learning***

# ##### *Creating Pipelines*

# In[ ]:


from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder,MinMaxScaler
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.metrics import RocCurveDisplay,confusion_matrix


# In[ ]:


crop_data.info()


# In[ ]:


num = ['N', 'P', 'K', 'Temperature_C', 'Humidity_%', 'pH', 'Rainfall_mm']


# In[ ]:


pipeline1 = Pipeline(
    steps = [
        ("Encoding",OneHotEncoder())
    ]
)


# In[ ]:


pipeline2 = Pipeline(
    steps = [
        ("Scaling",StandardScaler())
    ]
)


# In[ ]:


preprocessor = ColumnTransformer(
    transformers=[
        ("num",pipeline2,num)
    ]
)


# In[ ]:


X = crop_data.iloc[:,:-1]
Y = crop_data.iloc[:,-1:]


# In[ ]:


y = Y[['Crop_Name']].values
Y = y.ravel()


# In[ ]:


encoder = LabelEncoder()


# ##### *Data Splitting for Training model*

# In[ ]:


X_train,X_test,Y_train,Y_test = train_test_split(X,Y,test_size=0.05,random_state=42)


# In[ ]:


Y_train.reshape(-1,1)


# In[ ]:


Y_train = encoder.fit_transform(Y_train)
Y_test = encoder.transform(Y_test)


# ##### *Random Forest Classifier*

# In[ ]:


from sklearn.ensemble import RandomForestClassifier


# In[ ]:


rf = RandomForestClassifier(n_estimators=100,n_jobs=-1,max_depth=20,random_state=42)


# In[ ]:


pipeline_rf = Pipeline(
    steps = [
        ("preprocess",preprocessor),
        ("random forest",rf)
    ]
)


# In[ ]:


pipeline_rf.fit(X_train,Y_train)


# In[ ]:


pred_rf = pipeline_rf.predict(X_test)


# In[ ]:


from sklearn.metrics import accuracy_score,precision_score,recall_score,f1_score


# In[ ]:


pred_rf


# In[ ]:


acc_rf = accuracy_score(Y_test,pred_rf) * 100
pre_rf = precision_score(Y_test,pred_rf,average='weighted', zero_division=0) * 100
recall_rf = recall_score(Y_test,pred_rf,average='weighted', zero_division=0) * 100
f1_rf = f1_score(Y_test,pred_rf,average='weighted', zero_division=0) * 100


# In[ ]:


from sklearn.metrics import ConfusionMatrixDisplay
import matplotlib.pyplot as plt

ConfusionMatrixDisplay.from_estimator(pipeline_rf, X_test, Y_test, cmap='Blues')
plt.title('Confusion Matrix')
plt.show()


# In[ ]:


cm = confusion_matrix(Y_test, pred_rf)


# In[ ]:


import matplotlib.pyplot as plt
rf_model = pipeline_rf.named_steps['random forest']
importances = rf_model.feature_importances_
feature_names = pipeline_rf.named_steps['preprocess'].get_feature_names_out()
plt.figure(figsize=(12, 6))
plt.barh(feature_names, importances)
plt.xlabel('Feature Importance')
plt.title('Feature Importance from Random Forest Classifier')
plt.show()  


# ##### *XG BOOST*

# In[ ]:


import xgboost as xg


# In[ ]:


xgb = xg.XGBClassifier(n_estimators=200,random_state=42,learning_rate = 0.5,max_depth = 10,objective="multi:softmax")


# In[ ]:


pipeline_xgb = Pipeline(
    steps = [
        ("preprocess",preprocessor),
        ("XG Boost",xgb)
    ]
)


# In[ ]:


pipeline_xgb.fit(X_train,Y_train)


# In[ ]:


X_test.head(2)


# In[ ]:


pred_xgb = pipeline_xgb.predict(X_test)


# In[ ]:


acc_xgb = accuracy_score(Y_test,pred_xgb) * 100
pre_xgb = precision_score(Y_test,pred_xgb,average='weighted', zero_division=0) * 100
recall_xgb = recall_score(Y_test,pred_xgb,average='weighted', zero_division=0) * 100
f1_xgb = f1_score(Y_test,pred_xgb,average='weighted', zero_division=0) * 100


# In[ ]:


from sklearn.metrics import ConfusionMatrixDisplay
import matplotlib.pyplot as plt

ConfusionMatrixDisplay.from_estimator(pipeline_xgb, X_test, Y_test, cmap='Reds')
plt.title('Confusion Matrix')
plt.show()


# In[ ]:


from xgboost import plot_importance
xgb_model = pipeline_xgb.named_steps['XG Boost']
plot_importance(xgb_model)


# ##### *LOGISTIC REGRESSION*

# In[ ]:


from sklearn.linear_model import LogisticRegression


# In[ ]:


lr = LogisticRegression()


# In[ ]:


pipeline_lr = Pipeline(
    steps = [
        ("preprocess",preprocessor),
        ("Logistic",lr)
    ]
)


# In[ ]:


pipeline_lr.fit(X_train,Y_train)


# In[ ]:


pred_lr = pipeline_lr.predict(X_test)


# In[ ]:


acc_lr = accuracy_score(Y_test,pred_lr) * 100
pre_lr = precision_score(Y_test,pred_lr,average='weighted', zero_division=0) * 100
recall_lr = recall_score(Y_test,pred_lr,average='weighted', zero_division=0) * 100
f1_lr = f1_score(Y_test,pred_lr,average='weighted', zero_division=0) * 100


# In[ ]:


from sklearn.metrics import ConfusionMatrixDisplay
import matplotlib.pyplot as plt

ConfusionMatrixDisplay.from_estimator(pipeline_lr, X_test, Y_test, cmap='Greens')
plt.title('Confusion Matrix')
plt.show()


# ##### *Models Comparison*

# In[ ]:


a = {
    "Models" : ["LogisticRegression","RandomForestClassifier","XG Boost"],
    "Accuracy" : [acc_lr,acc_rf,acc_xgb],
    "Precision" : [pre_lr,pre_rf,pre_xgb],
    "Recall" : [recall_lr,recall_rf,recall_xgb],
    "F1 Score": [f1_lr,f1_rf,f1_xgb]
}
models = pd.DataFrame(a)


# In[ ]:


models


# In[ ]:


import seaborn as sns
import matplotlib.pyplot as plt


# In[ ]:


ax = sns.lineplot(x='Models', y='Accuracy', data=models, marker='o')
for x, y in zip(models['Models'], models['Accuracy']):
    ax.text(x, y, f"{y:.2f}%")

plt.show()


# In[ ]:


import joblib

# --- Determine Best Model ---
best_model_name = models.loc[models['Accuracy'].idxmax(), 'Models']

if best_model_name == "RandomForestClassifier":
    best_model = pipeline_rf
elif best_model_name == "XG Boost":
    best_model = pipeline_xgb
else:
    best_model = pipeline_lr

# --- Save Best Model ---
joblib.dump(best_model, "model.pkl")
print("model.pkl saved!")

# --- Save Label Encoder ---
joblib.dump(encoder, "label_encoder.pkl")
print("label_encoder.pkl saved!")

# --- Save Accuracy Details ---
accuracy_details = {
    "LogisticRegression": {
        "Accuracy": acc_lr,
        "Precision": pre_lr,
        "Recall": recall_lr,
        "F1": f1_lr
    },
    "RandomForestClassifier": {
        "Accuracy": acc_rf,
        "Precision": pre_rf,
        "Recall": recall_rf,
        "F1": f1_rf
    },
    "XG Boost": {
        "Accuracy": acc_xgb,
        "Precision": pre_xgb,
        "Recall": recall_xgb,
        "F1": f1_xgb
    },
    "BestModel": best_model_name
}

joblib.dump(accuracy_details, "accuracy.pkl")
print("accuracy.pkl saved!")


# #### ***Crop Recommendation***

# In[ ]:


crop_data.columns


# In[ ]:


print(f"pH value between {crop_data['pH'].min()} and {crop_data['pH'].max()}")
print(f"N value between {crop_data['N'].min()} and {crop_data['N'].max()}")
print(f"P value between {crop_data['P'].min()} and {crop_data['P'].max()}")
print(f"K value between {crop_data['K'].min()} and {crop_data['K'].max()}")
print(f"Humidity value between {crop_data['Humidity_%'].min()} and {crop_data['Humidity_%'].max()}")
print(f"Temperature_C value between {crop_data['Temperature_C'].min()} and {crop_data['Temperature_C'].max()}")
print(f"Rainfall_mm value between {crop_data['Rainfall_mm'].min()} and {crop_data['Rainfall_mm'].max()}")

