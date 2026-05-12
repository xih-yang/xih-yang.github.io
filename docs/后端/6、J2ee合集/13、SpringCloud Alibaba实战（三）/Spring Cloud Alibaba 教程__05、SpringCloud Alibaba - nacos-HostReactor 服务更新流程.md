# 05、SpringCloud Alibaba - nacos-HostReactor 服务更新流程
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/3/5.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程
### 1、获取服务信息

HostReactor 中的 getServiceInfo( ) 方法

```java
public ServiceInfo getServiceInfo(final String serviceName, final String clusters) {
        NAMING_LOGGER.debug("failover-mode: " + failoverReactor.isFailoverSwitch());
        String key = ServiceInfo.getKey(serviceName, clusters);
        //开启故障转移模式，从failoverReactor 获取服务列表
        if (failoverReactor.isFailoverSwitch()) {
            return failoverReactor.getService(key);
        }
        //从缓存中获取服务列表
        ServiceInfo serviceObj = getServiceInfo0(serviceName, clusters);
        if (null == serviceObj) {
        	//服务信息不存在时，创建新的服务信息，并放入缓存serviceInfoMap
            serviceObj = new ServiceInfo(serviceName, clusters);
            serviceInfoMap.put(serviceObj.getKey(), serviceObj);
            //记录服务正在更新中
            updatingMap.put(serviceName, new Object());
            //更新服务
            updateServiceNow(serviceName, clusters);
            //服务更新完删除缓存
            updatingMap.remove(serviceName);
        } else if (updatingMap.containsKey(serviceName)) {
            //服务正在更新中，wait 5s  UPDATE_HOLD_INTERVAL = 5000L
            if (UPDATE_HOLD_INTERVAL > 0) {
                // hold a moment waiting for update finish
                synchronized (serviceObj) {
                    try {
                        serviceObj.wait(UPDATE_HOLD_INTERVAL);
                    } catch (InterruptedException e) {
                        NAMING_LOGGER
                                .error("[getServiceInfo] serviceName:" + serviceName + ", clusters:" + clusters, e);
                    }
                }
            }
        }
        //服务更新任务不存在时，创建服务更新任务并调度
        scheduleUpdateIfAbsent(serviceName, clusters);
        return serviceInfoMap.get(serviceObj.getKey());
    }
```

### 2、故障转移

```java
	//failover-mode参数是由SwitchRefresher来处理的
	public boolean isFailoverSwitch() {
        return Boolean.parseBoolean(switchParams.get("failover-mode"));
    }
    //serviceMap是由FailoverFileReader来处理的
    public ServiceInfo getService(String key) {
        ServiceInfo serviceInfo = serviceMap.get(key);
        if (serviceInfo == null) {
            serviceInfo = new ServiceInfo();
            serviceInfo.setName(key);
        }
        return serviceInfo;
    }
```

### 3、从缓存中获取服务信息

```java
 private ServiceInfo getServiceInfo0(String serviceName, String clusters) {
        String key = ServiceInfo.getKey(serviceName, clusters);
        //从 serviceInfoMap 中获取服务信息
        return serviceInfoMap.get(key);
    }
```

### 4、从远程更新服务信息

当缓存中不存在服务信息时，更新服务

1、updateServiceNow( )

```java
private void updateServiceNow(String serviceName, String clusters) {
        try {
            updateService(serviceName, clusters);
        } catch (NacosException e) {
            NAMING_LOGGER.error("[NA] failed to update serviceName: " + serviceName, e);
        }
    }
```

2、updateService( )

```java
 public void updateService(String serviceName, String clusters) throws NacosException {
 		//获取远程服务列表前，再次查询缓存中是否存在服务信息，如果存在，在finally里将等待服务列表的线程唤醒，在下面第5步中讲解等待的线程
        ServiceInfo oldService = getServiceInfo0(serviceName, clusters);
        try {
            String result = serverProxy.queryList(serviceName, clusters, pushReceiver.getUdpPort(), false);
            if (StringUtils.isNotEmpty(result)) {
                processServiceJson(result);
            }
        } finally {
            if (oldService != null) {
                synchronized (oldService) {
                    oldService.notifyAll();
                }
            }
        }
    }
```

3、queryList( )

调用nacos服务端远程接口获取对应的服务信息

```java
public String queryList(String serviceName, String clusters, int udpPort, boolean healthyOnly)
            throws NacosException {
        final Map<String, String> params = new HashMap<String, String>(8);
        params.put(CommonParams.NAMESPACE_ID, namespaceId);
        params.put(CommonParams.SERVICE_NAME, serviceName);
        params.put("clusters", clusters);
        params.put("udpPort", String.valueOf(udpPort));
        params.put("clientIP", NetUtils.localIP());
        params.put("healthyOnly", String.valueOf(healthyOnly));
        return reqApi(UtilAndComs.nacosUrlBase + "/instance/list", params, HttpMethod.GET);
    }
```

4、processServiceJson( )

处理上一步的返回服务信息

```java
 public ServiceInfo processServiceJson(String json) {
        ServiceInfo serviceInfo = JacksonUtils.toObj(json, ServiceInfo.class);
        ServiceInfo oldService = serviceInfoMap.get(serviceInfo.getKey());
        //空或者返回的服务信息异常时，返回旧的服务信息
        if (pushEmptyProtection && !serviceInfo.validate()) {
            //empty or error push, just ignore
            return oldService;
        }
        boolean changed = false;
        if (oldService != null) {
            if (oldService.getLastRefTime() > serviceInfo.getLastRefTime()) {
                NAMING_LOGGER.warn("out of date data received, old-t: " + oldService.getLastRefTime() + ", new-t: "
                        + serviceInfo.getLastRefTime());
            }
            //将新的服务信息放入缓存
            serviceInfoMap.put(serviceInfo.getKey(), serviceInfo);
            //旧的服务主机Map
            Map<String, Instance> oldHostMap = new HashMap<String, Instance>(oldService.getHosts().size());
            for (Instance host : oldService.getHosts()) {
                oldHostMap.put(host.toInetAddr(), host);
            }
            //新的服务主机Map
            Map<String, Instance> newHostMap = new HashMap<String, Instance>(serviceInfo.getHosts().size());
            for (Instance host : serviceInfo.getHosts()) {
                newHostMap.put(host.toInetAddr(), host);
            }
            //修改了的主机
            Set<Instance> modHosts = new HashSet<Instance>();
            //新上线的主机
            Set<Instance> newHosts = new HashSet<Instance>();
            //下线的主机
            Set<Instance> remvHosts = new HashSet<Instance>();
            List<Map.Entry<String, Instance>> newServiceHosts = new ArrayList<Map.Entry<String, Instance>>(
                    newHostMap.entrySet());
            for (Map.Entry<String, Instance> entry : newServiceHosts) {
                Instance host = entry.getValue();
                String key = entry.getKey();
                if (oldHostMap.containsKey(key) && !StringUtils
                        .equals(host.toString(), oldHostMap.get(key).toString())) {
                    modHosts.add(host);
                    continue;
                }
                if (!oldHostMap.containsKey(key)) {
                    newHosts.add(host);
                }
            }
            for (Map.Entry<String, Instance> entry : oldHostMap.entrySet()) {
                Instance host = entry.getValue();
                String key = entry.getKey();
                if (newHostMap.containsKey(key)) {
                    continue;
                }
                if (!newHostMap.containsKey(key)) {
                    remvHosts.add(host);
                }
            }
            //记录服务主机变化日志信息
            if (newHosts.size() > 0) {
                changed = true;
                NAMING_LOGGER.info("new ips(" + newHosts.size() + ") service: " + serviceInfo.getKey() + " -> "
                        + JacksonUtils.toJson(newHosts));
            }
            if (remvHosts.size() > 0) {
                changed = true;
                NAMING_LOGGER.info("removed ips(" + remvHosts.size() + ") service: " + serviceInfo.getKey() + " -> "
                        + JacksonUtils.toJson(remvHosts));
            }
            if (modHosts.size() > 0) {
                changed = true;
                updateBeatInfo(modHosts);
                NAMING_LOGGER.info("modified ips(" + modHosts.size() + ") service: " + serviceInfo.getKey() + " -> "
                        + JacksonUtils.toJson(modHosts));
            }
            serviceInfo.setJsonFromServer(json);
            if (newHosts.size() > 0 || remvHosts.size() > 0 || modHosts.size() > 0) {
            	//发布服务变化事件 InstancesChangeEvent
                NotifyCenter.publishEvent(new InstancesChangeEvent(serviceInfo.getName(), serviceInfo.getGroupName(),
                        serviceInfo.getClusters(), serviceInfo.getHosts()));
                //写入缓村文件，如果开启了loadCacheAtStart，会在系统启动时从缓村加载服务信息
                DiskCache.write(serviceInfo, cacheDir);
            }
        } else {
        	//该分支是旧的服务不存在时
            changed = true;
            NAMING_LOGGER.info("init new ips(" + serviceInfo.ipCount() + ") service: " + serviceInfo.getKey() + " -> "
                    + JacksonUtils.toJson(serviceInfo.getHosts()));
            //服务信息存入内存缓存
            serviceInfoMap.put(serviceInfo.getKey(), serviceInfo);
            //发布InstancesChangeEvent事件
            NotifyCenter.publishEvent(new InstancesChangeEvent(serviceInfo.getName(), serviceInfo.getGroupName(),
                    serviceInfo.getClusters(), serviceInfo.getHosts()));
            serviceInfo.setJsonFromServer(json);
            //写入缓存文件
            DiskCache.write(serviceInfo, cacheDir);
        }
        //prometheus 监控统计
        MetricsMonitor.getServiceInfoMapSizeMonitor().set(serviceInfoMap.size());
        if (changed) {
            NAMING_LOGGER.info("current ips:(" + serviceInfo.ipCount() + ") service: " + serviceInfo.getKey() + " -> "
                    + JacksonUtils.toJson(serviceInfo.getHosts()));
        }
        return serviceInfo;
    }
```

### 5、服务正在更新中

等待5s时间，在等待过程中，如果服务更新完成，会发出通知唤醒等待的线程

```java
 if (UPDATE_HOLD_INTERVAL > 0) {
                // hold a moment waiting for update finish
                synchronized (serviceObj) {
                    try {
                        serviceObj.wait(UPDATE_HOLD_INTERVAL);
                    } catch (InterruptedException e) {
                        NAMING_LOGGER
                                .error("[getServiceInfo] serviceName:" + serviceName + ", clusters:" + clusters, e);
                    }
                }
            }
```

### 6、定时更新服务

1、scheduleUpdateIfAbsent( )

```java
public void scheduleUpdateIfAbsent(String serviceName, String clusters) {
		//缓存中服务是否存在
        if (futureMap.get(ServiceInfo.getKey(serviceName, clusters)) != null) {
            return;
        }
        synchronized (futureMap) {
        	//双重检验缓存
            if (futureMap.get(ServiceInfo.getKey(serviceName, clusters)) != null) {
                return;
            }
            //服务更新任务 UpdateTask
            ScheduledFuture<?> future = addTask(new UpdateTask(serviceName, clusters));
            futureMap.put(ServiceInfo.getKey(serviceName, clusters), future);
        }
    }
```

```java
 public synchronized ScheduledFuture<?> addTask(UpdateTask task) {
 		//延时1s调度任务  DEFAULT_DELAY = 1000L
        return executor.schedule(task, DEFAULT_DELAY, TimeUnit.MILLISECONDS);
    }
```

2、UpdateTask

```java
public void run() {
            long delayTime = DEFAULT_DELAY;
            try {
                ServiceInfo serviceObj = serviceInfoMap.get(ServiceInfo.getKey(serviceName, clusters));
                if (serviceObj == null) {
                	//服务信息不存在，更新服务信息
                    updateService(serviceName, clusters);
                    return;
                }
                if (serviceObj.getLastRefTime() <= lastRefTime) {
                	//服务信息更新时间不变，即跟上次相比服务没有更新
                	//更新服务信息
                    updateService(serviceName, clusters);
                    serviceObj = serviceInfoMap.get(ServiceInfo.getKey(serviceName, clusters));
                } else {
                    // if serviceName already updated by push, we should not override it
                    // since the push data may be different from pull through force push
                    //距离上次时间，服务已经更新过，只进行服务刷新，不处理拉取下来的新的服务
                    refreshOnly(serviceName, clusters);
                }
                //更新上次服务信息返回的时间字段
                lastRefTime = serviceObj.getLastRefTime();
                if (!notifier.isSubscribed(serviceName, clusters) && !futureMap
                        .containsKey(ServiceInfo.getKey(serviceName, clusters))) {
                    // abort the update task
                    NAMING_LOGGER.info("update task is stopped, service:" + serviceName + ", clusters:" + clusters);
                    return;
                }
                if (CollectionUtils.isEmpty(serviceObj.getHosts())) {
                	//服务主机为空时，增加失败次数
                    incFailCount();
                    return;
                }
                delayTime = serviceObj.getCacheMillis();
                //重置失败次数
                resetFailCount();
            } catch (Throwable e) {
                incFailCount();
                NAMING_LOGGER.warn("[NA] failed to update serviceName: " + serviceName, e);
            } finally {
            	//失败次数参与计算下次服务更新任务延时时间，最大是60s，Math.min(delayTime << failCount, DEFAULT_DELAY * 60)
                executor.schedule(this, Math.min(delayTime << failCount, DEFAULT_DELAY * 60), TimeUnit.MILLISECONDS);
            }
        }
```
