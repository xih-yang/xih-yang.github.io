# 08、Linux 实战 - 管道符、命令的别名和快捷键
- 来源：https://ddkk.com/zhuanlan/server/linux/5/8.html
- 分类：服务器框架
- 分组：教程目录
## 管道符：补充命令

命令格式： 命令1|命令2

作用：命令1的正确输出作为命令2的操作对象

**find命令的-exec选项和管道符的区别**：管道符的作用和find命令的-exec选项作用基本一致，那为什么还要开发两种命令呢？管道符的作用是一种文本流，可以看作是管道符将前面的命令输出为一个暂时的文本文件，这个文件是后面命令的操作对象，而find命令默认是不支持这种格式的，所以find命令有一个单独的选项-exec。

例1：

```java
[root@ddkk.com ~]# ll -h /etc | more  将/etc/目录下的文件分屏列出
......
```

例2：

```java
[root@ddkk.com ~]# ll -h /etc | grep "DIR" 将/etc/目录下名字中含有“DIR”的文件列出，这里用grep是因为grep是搜索文件中的字符串，而find是搜索系统中的文件名
......
```

### netstat命令

作用：查看当前的网络状态。

常用选项：

选项
作用

-a
列出所有网络状态，包括Scoket程序。

-c 秒数
指定隔几秒刷新一次网络状态。

-n
使用IP地址和端口号显示，不适用域名与服务名。（沈超老师这里有一个比喻我觉得很好，IP地址相当于门牌号，端口号就相当于这个家里每个人各自的邮箱。）

-p
显示PID和程序名。

-t
显示使用tcp协议端口的连接状况。

-u
显示使用UDP协议端口的连接状况。

-l
仅显示监听状态的连接。

-r
显示路由表。

```java
[root@ddkk.com ~]# netstat -tuln  列出目前正在使用的端口
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State      
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN     
tcp6       0      0 :::22                   :::*                    LISTEN     
udp        0      0 127.0.0.1:323           0.0.0.0:*                          
udp6       0      0 ::1:323                 :::*
```

```java
[root@ddkk.com ~]# netstat -an  查看当前所有的网络状态
Active Internet connections (servers and established)
Proto Recv-Q Send-Q Local Address           Foreign Address         State      
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN     
tcp        0     36 192.168.19.130:22       192.168.19.1:53513      ESTABLISHED
......
```

**ESTABLISHED**:这个状态说明有人正在登录服务器

### netstat与管道符

例3：

```java
[root@ddkk.com ~]# netstat -tuln | grep "22"  查找正在开启的网络端口中中含有22的网络，这样的命令太不准确，只是为了实验netstat与管道符的运用
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN     
tcp6       0      0 :::22                   :::*                    LISTEN 
```

例4：

```java
[root@ddkk.com ~]# netstat -an | grep "ESTABLISHED" 列出当前登录的用户
tcp        0     36 192.168.19.130:22       192.168.19.1:53513      ESTABLISHED
tcp        0      0 192.168.19.130:22       192.168.19.1:54753      ESTABLISHED
udp        0      0 192.168.19.130:68       192.168.19.254:67       ESTABLISHED
```

例5：

```java
[root@ddkk.com ~]# netstat -an | grep "ESTABLISHED" | wc -l  列出当前登录的用户个数
3
```

注：wc -l是列出文件的行数，在这里可以用来计算用户的个数

## alias 命令的别名：补充命令

Linux为了照顾用户，有一些命令非常长又要经常用，所以设置了别名来简化操作，系统中有一些别名是在安装时就已经设置好的，还可以自己设置别名，所以有了alias命令。

作用：设置别名以及查看系统中设置的别名

命令格式：

- 查看别名

```java
[root@ddkk.com ~]# alias  查看centos stream8中设置的别名
alias cp='cp -i'
alias egrep='egrep --color=auto'
alias fgrep='fgrep --color=auto'
alias grep='grep --color=auto'
alias l.='ls -d .* --color=auto'
alias ll='ls -l --color=auto'
......
```

- 设置别名

```java
[root@ddkk.com ~]# alias 别名=" 要简化的命令"   暂时修改
```

注:设置命令一般不与系统命令名字相同，因为别名的优先级要高于系统命令。

**若要使别名一直生效，需要添加进环境变量配置文件：~/.bashrc。**这个配置文件在家目录下，所以只有家目录用户使用系统时，设置才会生效。

## 常用快捷键：补充命令

快捷键
作用

Tab键
命令或文件补全，有一个相同的按一下Tab键就可以补全，有多个相同的按两下Tab就会有提示。

ctrl+A
把光标移动到命令行开头，如果我们输入的命令过长，想要把光标移动到命令行开头时使用。

ctrl+E
把光标移动到命令行结尾。

ctrl+C
强制终止当前的命令。

ctrl+L
清屏，相当于clear命令。

ctrl+U
删除或剪切光标之前的命令，输错命令时比较方便。

ctrl+Y
粘贴ctrl+U剪切的内容。
