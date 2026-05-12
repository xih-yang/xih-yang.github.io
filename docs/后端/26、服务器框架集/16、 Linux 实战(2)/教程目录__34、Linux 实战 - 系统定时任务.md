# 34、Linux 实战 - 系统定时任务
- 来源：https://ddkk.com/zhuanlan/server/linux/5/34.html
- 分类：服务器框架
- 分组：教程目录
## 系统定时任务

一般在linux中设置定时任务有两种方式：

- at一次性执行定时任务。
- cron循环执行定时任务。

### atd定时任务

#### at一次性执行定时任务

一般这两个任务都是已经启动的，但如果没有开启请先开启服务。

```java
[root@ddkk.com ~]# systemctl start atd
```

at的访问控制是依据/etc/at.allow(白名单)和/etc/at.deny(黑名单)两个文件来控制的。

- 默认是没有/etc/at.allow这个文件的，需要手动创建，创建后，之后名单内的用户才能使用atd服务。
- /etc/at.deny是默认存在的，这个文件中的用户是无法使用atd服务的。
- 如果两个文件都没有，那就只有root用户可以使用atd服务。

**命令格式**：

```java
[root@ddkk.com ~]# at [选项] 时间
```

**选项**：

- -m：当at工作完成后，无论是否有命令输出，都会用email通知执行at命令的用户。
- -c 工作号：显示该at工作的实际内容。

at支持的时间格式如下：

- HH:MM：在指定的"小时:分钟"执行命令，例如"03:25"
- HH:MM YYYY-MM-DD：在指定的"小时:分钟 年-月-日"执行命令
- HH:MM[am|pm] [mouth] [date]：在指定的"小时:分钟[上午|下午] [月] [日]"执行命令
- HH:MM[am|pm]+[minutes|hours|days|weeks]：在指定的时间"再加多久执行"，例如now + 5 minutes；05[pm] + 5 minutes

**注**：

- 需要输入at命令之后才会让输入定时执行的命令。
- 输入定时执行的命令之后按ctrl+D保存任务。

例：

```java
[root@ddkk.com ~]# at now + 3minutes
warning: commands will be executed using /bin/sh
at> echo "hello world! "
at> <EOT>
```

#### atq查询at任务

可以使用"at -c 任务号"或"atq"查询at任务。

```java
[root@ddkk.com ~]# atq
5	Fri Mar 11 00:54:00 2022 a root
```

#### atrm删除

可以用atrm命令删除"at任务"

```java
[root@ddkk.com ~]# atrm [工作号]
```

### crontab循环执行定时任务

#### crond 服务管理与访问控制

crond默认是开启的，如果没有开启，手动开启，把自启动服务设置好。

```java
[root@ddkk.com ~]# ps aux | grep crond
root         910  0.0  0.4  37164  3532 ?        Ss   01:02   0:00 /usr/sbin/crond -n
root        1541  0.0  0.1  12348   992 pts/0    S+   01:05   0:00 grep --color=auto crond
```

crond命令和at命令类似，也是通过/etc/cron.allow(白名单)和/etc/cron.deny(黑名单)来限制某些用户使用crond命令的权限。同样，/etc/cron.deny默认存在，有需要的话/etc/cron.allow可以手动创建。

#### 用户的crontab设置

crontab有两种方法设置定时任务，第一种是用命令行设置，每个用户都可以实现自己的crontab定时任务，只要使用这个用户身份执行"crontab -e"命令；第二种方法则是直接写入配置文件中。

**命令格式**：

```java
[root@ddkk.com ~]# crontab [选项]
```

**选项**：

- -e：编辑crontab定时任务，会通过vim编辑工作。
- -l：查询crontab定时任务。
- -r：删除当前用户所有的crontab定时任务，如果有多个，只想删除一个，可以使用"crontab -e"编辑。
- -u 用户名：修改或删除其他用户的crontab任务，只有root可用 。

**通过crontab -e打开编辑模式，以下面的格式添加要执行的命令**：

```java
* * * * * 执行的任务
```

**"*"的含义**：

*
含义
范围

第一个*
一小时中的第几分钟
0-59

第二个*
一天中的第几个小时
0-23

第三个*
一个月中的第几天
1-31-

第四个*
一年中的第几个月
1-12

第五个*
一周中的星期几
0-7(0,7都表示周日)

**特殊符号**：

符号
含义

*
代表所有时间。

，
代表不连续的时间，比如"10,50 * * * * 命令"表示在每小时的第10分钟第50分钟执行命令。

-
代表连续的时间范围，比如"10 0-6 * * * 命令"表示在每天的0点到6点之间的每个小时的第10分钟执行任务。

*/n
代表每隔多久执行一次任务，比如"*/20 * * * * 命令"代表每隔20分钟执行一次任务。

**注意事项**：

- 六个选项不能为空，必须填写，如果不确定使用"*"代表任意时间。
- crontab定时任务，最小有效时间是分钟，最大有效时间是月。
- 在定义时间时，星期和日期最好不要一起出现，容易造成混乱。
- 在定时任务重，不管是直接写命令，还是在 脚本中写，最好用绝对路径，有时相对路径的命令会报错。

**例**：

```java
[root@ddkk.com ~]# crontab -e
*/5 * * * * date >>/root/date.log
#每5分钟记录一次时间追加到/root/date.log文件中
```

#### 系统的crontab设置

命令行crontab设置的任务是以用户身份执行的，有些定时任务需要系统执行，这是就需要编辑/etc/crontab这个配置文件了，修改/etc/crontab配置文件是，定时任务的执行身份是可以手工指定的，这样更加灵活方便。

```java
[root@ddkk.com ~]# vim /etc/crontab
SHELL=/bin/bash
PATH=/sbin:/bin:/usr/sbin:/usr/bin
MAILTO=root
# For details see man 4 crontabs
# Example of job definition:
# .---------------- minute (0 - 59)
# |  .------------- hour (0 - 23)
# |  |  .---------- day of month (1 - 31)
# |  |  |  .------- month (1 - 12) OR jan,feb,mar,apr ...
# |  |  |  |  .---- day of week (0 - 6) (Sunday=0 or 7) OR sun,mon,tue,wed,thu,fri,sat
# |  |  |  |  |
# *  *  *  *  * user-name  command to be executed
```

上面的配置文件中已经提供了示例，可以依照这个格式添加crontab定时循环任务，前五个*号和前面是一样的，username是指定定时任务的执行身份，后面跟要执行的命令。

#### 利用指定目录执行定时任务

在/etc下有着crontab的几个指定目录，这几个指定目录下的可执行文件会定期循环执行，如果有想要定时执行的脚本，也可以放入这几个目录中。

- cron.hourly：每小时执行一次。
- cron.daily：每天执行一次。
- cron.monthly：每月执行一次。
- cron.weekly：每周执行一次。

这几个目录其实是靠anacron服务运行的，后面会讲到这个服务。

### anacron

Linux服务器也不会一直不断的运行下去，总会有需要关机的时候，那么这个时间段内的定时任务就无法执行了，这个时候就需要anacron服务了，anacron服务可以检测设置好的的定时有没有执行，如果超过了任务时间没有执行时，anacron就会将定时任务执行。

在/var/spool/anacron/目录下有几个文件，里面记录着/etc/目录下cron.daily、cron.monthly、cron.weekly下的上一次执行时间，如果超过规定时间，那就会找个时间执行。

```java
[root@ddkk.com ~]# ls /var/spool/anacron/
cron.daily  cron.monthly  cron.weekly
```

#### anacron命令

现在可以通过命令来设置anacron服务的设置。

**命令格式**：

```java
[root@ddkk.com ~]# anacron [选项] [工作名]
```

**选项**：

- -s：开始anacron工作，依据/etc/anancrontab文件中的设定的延迟时间执行
- -n：立即执行/etc/anacrontab中的所有工作，忽略所有的延迟时间
- -u：更新/var/spool/anacron/cron.*文件中的时间戳，但不执行任何工作。
- 工作名：是依据/etc/anacrontab文件中定义的工作名

#### anacron配置文件

一般工作中不适用anacron命令设置，而是直接修改anacron的配置文件/etc/anacrontab。

```java
[root@ddkk.com ~]# vim /etc/anacrontab
# /etc/anacrontab: configuration file for anacron
# See anacron(8) and anacrontab(5) for details.
SHELL=/bin/sh
PATH=/sbin:/bin:/usr/sbin:/usr/bin
MAILTO=root
# the maximal random delay added to the base delay of the jobs
RANDOM_DELAY=45
#这个值是设置的随机延迟，开机以后，如果有多个未完成的任务，不会一个接一个的执行，中间会设置随机
#延迟，因为有的任务工作量较大，比较占用系统资源，所以不能多个任务一起执行
# the jobs will be started during the following hours only
START_HOURS_RANGE=3-22
#这个是执行任务的时间范围，从凌晨3点到晚上22点
#period in days   delay in minutes   job-identifier   command
1       5       cron.daily              nice run-parts /etc/cron.daily
#任务间隔期是1天，指超过1天没有执行的话就执行；强制延迟是5分钟，执行的是/etc/cron.daily中的执行文件
#nice是设置优先级
7       25      cron.weekly             nice run-parts /etc/cron.weekly
@monthly 45     cron.monthly            nice run-parts /etc/cron.monthly
```

上面英文是原本的注释，中文是标注的解释。

#### anacron服务执行步骤

- 首先读取/var/spool/anacron/cron.daily中的上一次anacron执行时间。
- 和当前时间比较，如果两个时间的差值超过一天，就执行cron.daily工作。
- 执行这个工作只能在3:00到22:00之间。
- 执行工作强制延迟时间为5分钟，再随机延迟0-45分钟时间。
- 使用nice命令设置默认优先级，在使用run-parts命令执行指定目录下所有可执行文件。
