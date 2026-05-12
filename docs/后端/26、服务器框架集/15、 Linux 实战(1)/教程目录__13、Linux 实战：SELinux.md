# 13、Linux 实战：SELinux
- 来源：https://ddkk.com/zhuanlan/server/linux/2/13.html
- 分类：服务器框架
- 分组：教程目录
## SELinux

## 概念

SELinux（Security Enhanced Linux）：Linux安全强化

SELinux是在进行进程和文件等详细权限配置时依据的一个内核模块；且由于启动网络服务的也是进程，所以SELinux能够控制网络服务能否使用系统资源

**DAC**（Discretionary Access Control）：自主访问控制

1）依据进程的属主/属组与文件资源的rwx权限决定有无使用的权限

2）缺陷：root具有最高权限，且系统存在很多进程都由root主导导致可通过获取进程进行权限的非法提升

**MAC**（Mandatory Access Control）：强制访问控制

1）针对特定的进程与特定的文件资源进行权限配置

2）SELinux本质就是通过MAC管理和配置进程权限

如：默认情况下，apache进程仅能在/var/www/html目录下操作文档

//DAC没有SELinux的权限设置，且apache是root所主导的进程，

所以该进程可在三个目录下操作任何文档

//MAC由于有SELinux的权限设置（类似框架）

则apache进程仅能操作预先配置的目录（不能穿透框架操作没配置的）

## 运行模式

SELinux通过指定策略中的多个规则和安全上下文对比的结果决定主体是否具有操作目标资源的权限

**主体（Subject）**：进程（SELinux主要管理为进程，而不是用户）

**策略（Policy）**：通过多个详细规则（rule）来指定不同的服务是否具有某些目标操作的权限

Policy
含义

targeted
主要针对网络服务，本机限制较少 （默认策略）

minimum
仅针对选择的进程进行限制 （由targeted自定义而来）

mls
完整的SELinux限制 （限制最严格）

**目标（Object）**：文件系统（进程能否读写数据）

1）主体进程必须通过SELinux策略内的规则放行；

2）才可与目标资源进行安全上下文的对比；

3）若对比失败，则无法读写目标数据，若对比成功，则可以读写目标数据

//最终能否读写目标还与文件系统的rwx权限等设置有关

**安全上下文（Security context）**：SELinux的“rwx”权限配置

//安全上下文存放于每个文档的inode中

查看用户安全上下文的命令：id -Z

查看进程安全上下文的命令：ps -Z

查看文档安全上下文的命令：ls -Z

内容构成：用户类型、资源类型、数据类型、灵敏度、种类

字段
含义

用户类型
指定该资源属于的用户类型 root：root用户 user_u：普通用户 system_u：系统用户 uncondfined_u：不受限用户

资源类型
指定该资源的类型 object_r：代表该资源是文档（最常见） system_r：代表该资源是进程 unconfined_r：代表不受限的资源

数据类型
根据策略判断进程能否读写指定的文档

灵敏度
指定访问限制层级 0-15级（默认s0），数值越低限制越低

种类
指定划分不同种类 c0-c1023代表共有1024个种类

1）多数本地进程和Bash服务产生的文档，其用户类型大部分为unconfined_u，网络服务和系统（软件）服务运行所产生的文档，其用户类型大部分为system_u

2）数据类型是安全上下文中最重要的字段，主体能否访问资源就取决于：进程安全上下文的数据类型字段是否和文档安全上下文的数据类型字段相匹配

3）数据类型在主体和目标的定义不相同：在主体中被称为域（domain），在目标中被称为类型（type）

4）一个选项只能有一个灵敏度，但能有多个种类（且种类为可选字段）

如：查看apache进程和/var/www/html目录的安全上下文

//apache进程的域是httpd_t，而/var/www/html目录的类型是httpd_sys_content_t，则两者的安全上下文的数据类型经过策略对比后是相匹配的，则apache是可以访问/var/www/html目录的

如：查看主机所有进程的安全上下文

用户类型
资源类型
对应的策略意义

unconfined_u
unconfined_r
普通登录用户的进程，且不受限。大多都是用户已顺利登录系统（不论是网络还是本机登录来获取可用的Shell）后，所用来操作系统的进程，如：Bash、X Windows等。

system_u
system_r
系统账户，因此是非交互式的系统运行进程，大多数系统进程均为该类型

如：crond进程读取/etc/crontab和/etc/cron.d

1）触发一个具有“crond_exec_t”数据类型的可执行目标文件，产生一个进程；

2）该文件的数据类型会使该进程具有“crond”的域；

3）再根据主机上已有策略制定的众多规则，规定能够读写的数据类型的资源；

4）由于crond进程的域（domain）被设置为可读写“system_cron_spool_t”数据类型的资源，且/etc/cron.d的数据类型为system_cron_spool_t；

5）因此只要相关配置文件存放到/etc/cron.d/目录下，crond进程都可读写；

6）最终能否读写配置文件还与该文件的rwx权限等设置有关。

### 启动/关闭

模式
含义

Disabled
关闭模式 SELinux没有运行

Permissive
宽容模式 SELinux运行，但仅会有警告信息（不会限制进程）

Enforcing
强制模式 SELinux运行，正常限制domain/type

//并非所有的Linux发行版都支持SELinux（Centos7默认支持SELinux）

//Permissive模式下虽然也进行策略规程和安全上下文的比对，

但出错时仅会报错，并不会限制进程

如：Bash就是不受SELinux管制的进程

//数据类型为unconfined_t的进程都是不受SELinux管制的进程

**getenforce命令**：查看当前SELinux模式

指令格式：getenforce

如：查看当前主机的SELinux模式

**sestatus命令**：查看当前SELinux的策略

指令格式：sestatus 选项

选项
含义

-v
同时列出/etc/sestatus.conf内文件与进程的安全上下文

-b
同时列出当前策略规则的布尔值

如：查看当前主机SELinux的策略

SELinux的配置文件：/etc/selinux/config

//在修改SELinux的策略/模式后需重启激活（SELinux是整合到内核中的）

SELinux在运行中可在Enforcing和Permissive模式中互相切换（但不能关闭）

**setenforce命令**：切换SELinux模式

指令格式：setenforce 选项

选项
含义

0
切换成Permissive（宽容模式）

1
切换成Enforcing（强制模式）

1）setenforce无法在Disabled模式下进行切换

2）若由Disabled切换成Enforcing后开始报错（/lib/xxx里的数据没有权限读取）可切换到Permissive后使用“restorecon

-RV /”重新还原所有SELinux类型

//这是由于重新写入SELinux类型（Relabel）出错的原因

## 配置SELinux

**getsebool命令**：查看当前主机上策略的规则是否启动

指令格式：getsebool 选项

选项
含义

-a
列出当前主机上所有SELinux规则的布尔值状态

//效果同“sestatus -b”查询SELinux规则的布尔值

如：查看当前主机上SELinux规则的布尔值状态

**setsebool命令**：修改SELinux规则的布尔值

指令格式：setsebool 选项 规则名 布尔值

选项
含义

-P
直接将设置值写入配置文件

如：更改httpd_enable_homedirs规则的布尔值

**seinfo命令**：查看主机上SELinux配置

指令格式：seinfo 选项

选项
含义

-b
列出SELinux策略所有规则种类

-u
列出SELinux所有用户类型种类

-r
列出SELinux所有资源类型种类

-t
列出SELinux所有数据类型种类

//seinfo不是Centos7默认安装工具，需通过安装才可使用

如：查看当前主机中SELinux相关配置

**sesearch命令**：查看SELinux

指令格式：sesearch 选项

选项
含义

-A
显示allow的数据

-s
指定进程的域

-t
指定数据类型

-b
指定规则

如：查询域为crond_t的进程能够读取名中带有“spool”的SELinux数据类型

//第一个框为：进程的域；第二个框为：SELinux数据类型

进程可读写后面紧跟的SELinux数据类型

如：查询在httpd_enable_homedirs规则中，域能够读取的SELinux数据类型[

chcon命令：修改文档的SELinux安全上下文

指令格式1：chcon 选项 文档

选项
含义

-R
递归设置（同时设置该目录下的子目录）

-u
指定用户类型

-r
指定资源类型

-t
指定数据类型

-v
若修改成功，将修改成果列出

如：使selinux文件的用户类型和数据类型和/etc/hosts文件相同

指令格式2：chchon -R --reference=源文档 目标文档

1）根据源文档的安全上下文修改目标文档的安全上下文

如：使selinux文件的安全上下文和/etc/shadow的SELinux安全上下文相同

**restorecon命令**：使文档的SELinux数据类型恢复默认模式

指令格式：restorecon 选项 文档路径

选项
含义

-R
递归恢复（连同子目录一同恢复）

-v
显示恢复过程

如：将selinux文件恢复到默认的SELinux安全上下文

**semanage命令**：查询/修改文档默认SELinux安全上下文

指令格式1：semanage fcontext -l //列出所有安全上下文

1）semanage多种用法：login、user、port、interface、translation和fcontext

//其中fcontext作用于SELinux安全上下文

如：查看/root目录的SELinux默认安全上下文

//这就是在使用restorecon恢复selinux文件默认安全上下文时的依据

如：查看当前主机上各文档的SELinux默认安全上下文

//当建立新文档和使用restorecon恢复文档默认安全上下文时，系统就会根据该记录配置文档的SELinux安全上下文

指令格式2：semanage fcontext 操作 选项 文档

操作
含义

-a
添加指定的默认安全上下文配置

-m
修改指定的默认安全上下文配置

-d
删除指定的默认安全上下文配置

选项
含义

-s
指定用户类型

-r
指定资源类型

-t
指定数据类型

如：配置/srv/mycron目录默认SELinux安全上下文

1）建立/srv/mycron目录，在/root目录下建立selinux文件，并移动到/srv/mycron目录下；

2）查看/srv的SELinux默认安全上下文

3）修改/srv/mycron默认的安全上下文，并使用restorecon递归恢复/srv/mycron默认的SELinux数据类型

## 日志文件协助

auditd服务：使SELinux的审核信息写入/var/log/audit/audit.log中

如：查看系统中的/var/log/audit/audit.log文件

//可读性较差

setroubleshootd服务：将SELinux报错信息和解决方法写入到/var/log/messages

1）本质上就是setroubleshootd服务将/var/log/audit/audit.log文件内的信息“翻译”成较高可读性的信息后，再存入/var/log/messages文件

2）setroubleshootd服务运行需要setroubleshoot和setroubleshoot-server软件

//由于auditd和setroubleshootd服务记录是同样的信息

所以在Centos 6以后，setroubleshootd服务就整合到auditd服务中

如：查看系统中的/var/log/messages文件

Centos 7中setroubleshootd运行流程：

1）先由auditd服务调用audispd服务；

2）再有audispd服务启动sedispatch程序；

3）sedispatch程序将原本的auditd信息“翻译”成setroubleshoot信息，并保存

sealert命令：根据setroubleshootd服务提供的信息诊断SELinux

指令格式：sealert -l 标识符

如：查看/var/log/message中报错信息，并得知报错信息的标识符，调用sealert诊断该标识符相关的SELinux原因和解决方法
