# 10、Kubernetes - 实战：安装Kubernetes原生的airflow
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/4/10.html
- 分类：容器服务
- 分组：教程目录
## 一、前言

Airflow是Airbnb的基于DAG(有向无环图)的任务管理系统，是进行任务分割、调度处理的利器。在生产实践中，有业务部门需要使用airflow来进行大批量数据的分多阶段、阶段内高并发的处理；结合airflow的任务分割调度能力和Kubernetes的集群资源动态调配能力，就可以快速达到业务目标。

## 二、安装支持Kubernetets的airflow

### 2.1 获取airflow代码

> git clone https://github.com/apache/incubator-airflow.git

### 2.2 修改airflow文件支持本地Kubernetes环境

> patch Dockerfile
> scripts/ci/kubernetes/kube/airflow.yaml
> scripts/ci/kubernetes/kube/configmaps.yaml
> scripts/ci/kubernetes/kube/deploy.sh
> scripts/ci/kubernetes/kube/volumes.yaml

```java
1.patch Dockerfile
Add above kubeconfig file as /root/.kube/config for airflow image
RUN mkdir /root/.kube
COPY config /root/.kube/config
2. scripts/ci/kubernetes/kube/airflow.yaml
-    namespace: default
+    namespace: air-job
-        image: airflow
-        imagePullPolicy: IfNotPresent
+        image: 172.222.22.11:5000/airflow
+        imagePullPolicy: Always
3. scripts/ci/kubernetes/kube/configmaps.yaml
-    executor = KubernetesExecutor
+    executor = LocalExecutor
-    namespace = default
+    namespace = air-job
-    rbac = True
+    rbac = False
4. scripts/ci/kubernetes/kube/deploy.sh
-kubectl delete -f $DIRNAME/postgres.yaml
-kubectl delete -f $DIRNAME/airflow.yaml
-kubectl delete -f $DIRNAME/secrets.yaml
+kubectl delete -f $DIRNAME/postgres.yaml -n air-job
+kubectl delete -f $DIRNAME/airflow.yaml -n air-job
+kubectl delete -f $DIRNAME/secrets.yaml -n air-job
-kubectl apply -f $DIRNAME/secrets.yaml
-kubectl apply -f $DIRNAME/configmaps.yaml
-kubectl apply -f $DIRNAME/postgres.yaml
-kubectl apply -f $DIRNAME/volumes.yaml
-kubectl apply -f $DIRNAME/airflow.yaml
+kubectl apply -f $DIRNAME/secrets.yaml -n air-job
+kubectl apply -f $DIRNAME/configmaps.yaml -n air-job
+kubectl apply -f $DIRNAME/postgres.yaml -n air-job
+kubectl apply -f $DIRNAME/volumes.yaml -n air-job
+kubectl apply -f $DIRNAME/airflow.yaml -n air-job
-  PODS=$(kubectl get pods | awk 'NR>1 {print $0}')
+  PODS=$(kubectl get pods -n air-job | awk 'NR>1 {print $0}')
-POD=$(kubectl get pods -o go-template --template '{
    {range .items}}{
    {.metadata.name}}{
    {"\n"}}{
    {end}}' | grep airflow | head -1)
+POD=$(kubectl get pods -n air-job -o go-template --template '{
    {range .items}}{
    {.metadata.name}}{
    {"\n"}}{
    {end}}' | grep airflow | head -1)
 echo "------- pod description -------"
-kubectl describe pod $POD
+kubectl describe pod $POD -n air-job
 echo "------- webserver logs -------"
-kubectl logs $POD webserver
+kubectl logs $POD webserver -n air-job
 echo "------- scheduler logs -------"
-kubectl logs $POD scheduler
+kubectl logs $POD scheduler -n air-job
5. scripts/ci/kubernetes/kube/volumes.yaml
+  annotations:
+    volume.beta.kubernetes.io/storage-class: "nfs-client"
Also change volume size and remove  PersistentVolume
-kind: PersistentVolume
-apiVersion: v1
-metadata:
-  name: airflow-dags
-spec:
-  accessModes:
-    - ReadWriteOnce
-  capacity:
-    storage: 2Gi
-  hostPath:
-    path: /airflow-dags/
----
 kind: PersistentVolumeClaim
 apiVersion: v1
 metadata:
   name: airflow-dags
+  annotations:
+    volume.beta.kubernetes.io/storage-class: "nfs-client"
 spec:
   accessModes:
     - ReadWriteMany
   resources:
     requests:
-      storage: 2Gi
----
-kind: PersistentVolume
-apiVersion: v1
-metadata:
-  name: airflow-logs
-spec:
-  accessModes:
-    - ReadWriteMany
-  capacity:
-    storage: 2Gi
-  hostPath:
-    path: /airflow-logs/
+      storage: 100Gi
 ---
 kind: PersistentVolumeClaim
 apiVersion: v1
 metadata:
   name: airflow-logs
+  annotations:
+    volume.beta.kubernetes.io/storage-class: "nfs-client"
 spec:
   accessModes:
     - ReadWriteMany
   resources:
     requests:
-      storage: 2Gi
----
-kind: PersistentVolume
-apiVersion: v1
-metadata:
-  name: test-volume
-spec:
-  accessModes:
-    - ReadWriteOnce
-  capacity:
-    storage: 2Gi
-  hostPath:
-    path: /airflow-dags/
+      storage: 100Gi
 ---
 kind: PersistentVolumeClaim
 apiVersion: v1
 metadata:
   name: test-volume
+  annotations:
+    volume.beta.kubernetes.io/storage-class: "nfs-client"
 spec:
   accessModes:
     - ReadWriteMany
   resources:
     requests:
-      storage: 2Gi
+      storage: 10Gi
```

### 2.3 构建镜像

```java
export AIRFLOW_GPL_UNIDECODE=yes
./scripts/ci/kubernetes/docker/build.sh 
docker tag airflow 172.222.22.11:5000/airflow
docker push 172.222.22.11:5000/airflow
```

### 2.4 部署

```java
#运行部署脚本
./scripts/ci/kubernetes/kube/deploy.sh 
#查看部署结果
kubectl get all
NAME                                   READY     STATUS    RESTARTS   AGE
pod/airflow-5cff4ccbb9-4qvxq           2/2       Running   0          30m
pod/postgres-airflow-bbb79b866-wgrcr   1/1       Running   0          32m
NAME                       TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
service/airflow            NodePort    10.96.100.122   <none>        8080:30809/TCP   32m
service/postgres-airflow   ClusterIP   10.96.177.122   <none>        5432/TCP         32m
NAME                               DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/airflow            1         1         1            1           32m
deployment.apps/postgres-airflow   1         1         1            1           32m
NAME                                         DESIRED   CURRENT   READY     AGE
replicaset.apps/airflow-5cff4ccbb9           1         1         1         32m
replicaset.apps/postgres-airflow-bbb79b866   1         1         1         32m
#查看PVC
kubectl get pvc
NAME           STATUS    VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
airflow-dags   Bound     pvc-b522f935-d6a6-11e8-9a48-fa163ebda1b8   100Gi      RWX            nfs-client     59m
airflow-logs   Bound     pvc-b5243605-d6a6-11e8-9a48-fa163ebda1b8   100Gi      RWX            nfs-client     59m
test-volume    Bound     pvc-b526f36b-d6a6-11e8-9a48-fa163ebda1b8   10Gi       RWX            nfs-client     59m
#查看NFS存储
ls /mnt/nfs/air-job-airflow-dags-pvc-b522f935-d6a6-11e8-9a48-fa163ebda1b8/
docker_copy_data.py                       example_kubernetes_operator.pyc              example_trigger_target_dag.py
docker_copy_data.pyc                      example_latest_only.py                       example_trigger_target_dag.pyc
example_bash_operator.py                  example_latest_only.pyc                      example_xcom.py
example_bash_operator.pyc                 example_latest_only_with_trigger.py          example_xcom.pyc
example_branch_operator.py                example_latest_only_with_trigger.pyc         __init__.py
example_branch_operator.pyc               example_passing_params_via_test_command.py   __init__.pyc
example_branch_python_dop_operator_3.py   example_passing_params_via_test_command.pyc  mydag-fail.py
example_branch_python_dop_operator_3.pyc  example_python_operator.py                   mydag-fail.pyc
example_docker_operator.py                example_python_operator.pyc                  mydag.py
example_docker_operator.pyc               example_short_circuit_operator.py            mydag.pyc
example_http_operator.py                  example_short_circuit_operator.pyc           subdags
example_http_operator.pyc                 example_skip_dag.py                          test_utils.py
example_kubernetes_annotation.py          example_skip_dag.pyc                         test_utils.pyc
example_kubernetes_annotation.pyc         example_subdag_operator.py                   tutorial.py
example_kubernetes_executor.py            example_subdag_operator.pyc                  tutorial.pyc
example_kubernetes_executor.pyc           example_trigger_controller_dag.py
example_kubernetes_operator.py            example_trigger_controller_dag.pyc
```

### 2.5 访问GUI

## 三、运行自定义的任务

定义两个任务一个会成功一个会失败，使用kubernetes_pod_operator，这个任务会成功mydag.py

```java
from airflow import DAG
from datetime import datetime, timedelta
from airflow.contrib.operators.kubernetes_pod_operator import KubernetesPodOperator
from airflow.operators.dummy_operator import DummyOperator
default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': '20181023',
    'email': ['airflow@example.com'],
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5)
}
dag = DAG(
    'kubernetes_sample_pass', default_args=default_args, schedule_interval=timedelta(minutes=600))
start = DummyOperator(task_id='run_this_first', dag=dag)
passing = KubernetesPodOperator(namespace='air-job',
                          image="python:3.6",
                          cmds=["python","-c"],
                          arguments=["print('hello world')"],
                          labels={"foo": "bar"},
                          name="passing-test",
                          task_id="passing-task",
                          get_logs=True,
                          dag=dag
                          )
success = KubernetesPodOperator(namespace='air-job',
                          image="ubuntu:16.04",
                          cmds=["echo","hello world"],
                          labels={"foo": "bar"},
                          name="success",
                          task_id="success-task",
                          get_logs=True,
                          dag=dag
                          )
passing.set_upstream(start)
success.set_upstream(start)
```

再定义一个会失败的任务进行对比，[mydag-fail.py](http://mydag-fail.py/)

```java
from airflow import DAG
from datetime import datetime, timedelta
from airflow.contrib.operators.kubernetes_pod_operator import KubernetesPodOperator
from airflow.operators.dummy_operator import DummyOperator
default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': '20181023',
    'email': ['airflow@example.com'],
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5)
}
dag = DAG(
    'kubernetes_sample_fail', default_args=default_args, schedule_interval=timedelta(minutes=600))
start = DummyOperator(task_id='run_this_first', dag=dag)
passing = KubernetesPodOperator(namespace='air-job',
                          image="python:3.6",
                          cmds=["python","-c"],
                          arguments=["print('hello world')"],
                          labels={"foo": "bar"},
                          name="passing-test",
                          task_id="passing-task",
                          get_logs=True,
                          dag=dag
                          )
failing = KubernetesPodOperator(namespace='air-job',
                          image="ubuntu:16.04",
                          cmds=["python","-c"],
                          arguments=["print('hello world')"],
                          labels={"foo": "bar"},
                          name="fail",
                          task_id="failing-task",
                          get_logs=True,
                          dag=dag
                          )
passing.set_upstream(start)
failing.set_upstream(start)
```

将任务倒入：

```java
kubectl cp mydag.py air-job/airflow-5cff4ccbb9-4qvxq:/root/airflow/dags -c scheduler
kubectl cp mydag-fail.py air-job/airflow-5cff4ccbb9-4qvxq:/root/airflow/dags -c scheduler
```

分别运行成功和失败的任务：

通过以下方式可以调整POD资源配置

```java
# Limit resources on this operator/task with node affinity & tolerations
three_task = PythonOperator(
    task_id="three_task", python_callable=print_stuff, dag=dag,
    executor_config={
        "KubernetesExecutor": {"request_memory": "128Mi",
                               "limit_memory": "128Mi",
                               "tolerations": tolerations,
                               "affinity": affinity}}
)
```

## 四、业务系统多阶段多并发任务

业务使用airflow和Kubernetes进行业务处理
