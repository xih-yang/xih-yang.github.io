# 24、Python 教程 - 应用案例_linux系统的监控
- 来源：https://ddkk.com/zhuanlan/other/python/3/24.html
- 分类：Python 进阶探索
- 分组：教程目录
需求：

1. 获取当前主机信息， 包含操作系统名， 主机名，内核版本， 硬件架构等
2. 获取开机时间和开机时长；
3. 获取当前登陆用户

```java
import os
import psutil
from datetime import datetime
print('主机信息'.center(50,'*'))
info = os.uname()
print("""
    操作系统:%s
    主机名称:%s
    内核版本:%s
    硬件架构:%s
"""%(info.sysname,info.nodename,info.release,info.machine))
print('开机信息'.center(50,'*'))
boot_time = psutil.boot_time()返回的是一个时间戳
# 将时间戳转化为datatime类型的时间
boot_time_obj = datetime.fromtimestamp(boot_time)
print(type(boot_time_obj))
now_time = datetime.now()
print(now_time)
delta_time = datetime.now()
delta_time = now_time - boot_time_obj
print(delta_time)
print(type(delta_time))
print('开机时间:',boot_time_obj)
# str是为了将时间 对象转换为字符串 实现分离
print('当前时间:',str(now_time).split('.')[0])
print('开机时间:',str(delta_time).split('.')[0])
print('当前登陆用户'.center(50,'*'))
login_user = psutil.users()
print(login_user)
info = psutil.users()[0]
print(info.name)
```
