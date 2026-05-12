# 07、Python 教程 - Python中的命令行提示符的实现
- 来源：https://ddkk.com/zhuanlan/other/python/3/7.html
- 分类：Python 进阶探索
- 分组：教程目录
使用以下方法即可使用python实现命令行提示符：

```java
import os
# print(os.system('ls'))
# print(os.system('pwd'))
for i in range(1000):
    cmd = input('[test@ ~]$ ]')
    if cmd:
        if cmd == 'exit':
            print('logout')
            break
        else:
            print('run %s' %(cmd))
            运行shell命令
            os.system(cmd)
    else:
        continue
```
