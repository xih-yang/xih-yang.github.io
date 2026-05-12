# 16、Linux 实战：软件安装-RPM-YUM
- 来源：https://ddkk.com/zhuanlan/server/linux/2/16.html
- 分类：服务器框架
- 分组：教程目录
## RPM

发行版代表
软件管理机制
相关命令
在线升级

Red Hat/Fedora
RPM
rpm和rpmbuild
YUM

Debian/Ubuntu
DPKG
dpkg
APT

**RPM（RedHat Package Manager）**：以数据库记录的方式管理Linux系统软件

1）RPM文件命名格式：**软件名-版本信息-发布次数.适用的硬件平台.rpm**

如：查看系统自带的RPM包文件名

1）软件名：软件的用于辨别的具体名称

2）版本信息：软件包的内所含的软件版本（通常为主版本和次版本）

3）发布次数：软件已被编译的次数

4）适用的硬件平台：RPM软件包对于不同的硬件平台具有差异

//RPM软件包可适用不同的操作平台

硬件平台名
说明

i386
适用于所有x86平台 （i代表Intel兼容的CPU，386代表CPU的等级）

i586
针对586级别的计算机进行优化编译

i686
针对686级别的计算机进行优化编译

x86_64
针对64位的CPU进行优化编译

noarch
没有任何硬件等级限制

//Centos 7默认推出适用于x86_64的RPM软件包，且不提供i686以下级别的软件包

//适用于低级别的软件包可安装到高级别的硬件平台上（向下兼容），但适用于高级别的软件包不可安装在低级别的硬件平台上

RPM安装软件的优点：

1）需安装的软件已编译完成并打包完毕（打包成RPM机制的文件）；

//在软件传输和安装上非常便利（不需重新编译和检验软件是否传输错误）

2）打包文件含数据库记录该软件安装使所必须的依赖属性软件；

//RPM会检测系统的硬盘容量、操作系统版本等信息，避免安装错误

//提供的数据库信息包含软件版本信息、依赖属性信息、软件用途说明和软件所含文件等信息，便于了解该软件

3）用户只需通过RPM进行安装，RPM自动检测系统是否满足软件的依赖性

//满足则安装，不满足则拒绝安装

4）安装时，该软件的相关信息会写入到RPM的数据库中（方便后期管理）

//数据库记录RPM文件的相关参数，便于升级、卸载、查询和验证等功能

RPM安装软件的缺点：

1）由于软件预先编译完成，所以安装软件的系统必须与打包该软件的安装文件的系统环境相同才行；

2）不同Linux发行版所发布的RPM文件不能通用；

3）卸载时，需考虑其他软件的依赖关系；

//若强制卸载某个底层软件，可能导致整个系统崩溃

## rpm

rpm命令：对Linux服务器上的软件包进行管理（查询、安装、卸载）

指令格式：rpm --rebuilddb //重建rpm数据库

1）/var/lib/rpm目录：存放已安装软件相关信息的rpm数据库

2）仅有root用户具有权限执行rpm命令

指令格式1：rpm 选项 软件名 //查询安装软件情况

选项
含义

-q
使用询问模式

-a
查询所有软件

-i
列出该软件的详细信息

-l
列出该软件安装的文件所在路径

-c
列出该软件的所有配置文件 （/etc目录下各个文件）

-d
列出该软件的所有说明文件

-R
列出软件安装所需要依赖的软件/文件

-f 文件路径
列出指定文件属于哪个已安装的软件

//若查询未安装软件的软件包，添加“-p”选项即可

如：查询系统所有已安装的软件

如：查询系统是否安装qq和httpd软件

//查询某一软件“rpm -qa | grep 软件关键词“，若系统没安装该软件，则不会显示任何信息

如：列出htppd软件的详细信息

如：列出htppd软件的所有相关的配置文件

如：列出httpd软件的所有说明文档和帮助文件

如：列出安装httpd软件时所依赖的软件/文件

如：查询/bin/sh和/etc/yum.repos.d/local.repo文件属于那些已安装软件

//即使文件被删除了，也可查询之前存在的文件属于那些软件，因为/var/lib/RPM数据库记录的数据不会立刻更新（删除）

指令格式2：rpm 选项 软件包名称/软件包所在具体网址 //安装指定软件

//若一次性安装多个软件，软件包名之间以空格分隔

选项
含义

-i
安装指定软件

-U
升级指定软件 若软件没安装，则默认安装最新版

-F
升级指定软件 若软件没安装，则不进行任何操作

-v
显示指令执行过程 （显示进度条）

-h
套件安装时列出标记 （以“#”形式表示进度条）

--nodeps
忽略软件依赖性检测，继续安装 （可能导致软件安装后，不可正常运行）

--replacefiles
安装时覆盖已存在系统上的相同安装文件

--replacepkgs
覆盖安装 （系统已存在该软件，重新安装并覆盖原软件）

--force
强制安装 （--replacefiles和--replacepkgs选项的综合体）

--test
检测该软件是否能在系统安装 （仅检测（主要检测依赖性），并不安装）

--justdb
更新打包文件内自带的数据库文件

--nosignature
忽略软件的数字签名检测

--prefix 目录路径
指定该目录为软件的安装目录（自定义安装）

--noscripts
在安装过程不执行任何Script命令 （如：安装过程中会默认更新RPM数据库）

//软件包可联网下载或从设备中读取

//系统若进行大量软件更新时，可运行“rpm -Fvh”

安装软件时，相关内容存放位：

目录
说明

/etc
软件的主要配置文件

/usr/bin
软件的可执行文件

/usr/lib
软件运行时所调用的动态函数库

/usr/share/doc
软件的使用手册和说明文件

/usr/share/man
软件的man page文件

指令格式3：rpm 选项 //验证软件

选项
含义

-Va
列出系统所有可能被修改的文件

-V 软件名
列出该软件中被修改的文件

-Vf 软件的文件路径
查询指定软件的文件是否被修改

//若被修改，则显示被修改的信息（反之，则不显示）

如：列出系统中所有可能被修改的文件

如：列出httpd和vsftpd软件中被修改的文件

如：查询/etc/crontab是否被修改过

内容构成：**修改类型 文件类型 文件名**

修改类型总共为9位（SM5DLUGTP）顺序不可变（“.”代表没有）：

修改类型
说明

S （file Size differs）
文件的容量被修改

M （Mode differs）
文件的属性/类型被修改

5 （MD5 sum differs）
MD5校验值被修改

D （Device major/minor number mis – match）
设备的主/次代码被修改

L （readLink(2) path mis – match）
链接路径被修改

U （User ownership differs）
文件的所属用户被修改

G （Group ownership differs）
文件的所属用户组被修改

T （mTime differs）
文件的建立时间被修改

P （caPabilities differ）
文件功能被修改

文件类型在一个文件中仅能出现一类：

文件类型
说明

c （config file）
配置文件

d （documentation）
数据文件

g （ghost file）
幽灵文件 （该文件不属于任何软件）

l （license file）
许可证文件

r （read me）
自述文件

指令格式4：rpm -e 软件名称 //卸载某一软件

选项
含义

-e
删除指定套件

1）卸载过程应从上之下（防止依赖性问题导致系统出错）

2）卸载存在依赖关系的软件：rpm -e 软件名称 --nodeps

如：卸载系统中的httpd软件

**RPM数字签名（digital signature）**：提供软件安装过程中的验证

1）Centos的数字签名系统为GPG（GNU Privacy Guard）

//GPG通过哈希运算可算出独一无二的专属密钥和数字签名

RPM软件安装时，数字签名验证过程：

1）系统已安装RPM软件厂商提供的公钥文件；

2）安装RPM软件时，rpm会自动读取RPM软件的签名信息并与系统已安装的公钥文件做对比；

3）若对比成功则进行安装（反之，则给予警告并拒绝安装）

Centos 7的GPG数字签名公钥文件：/etc/pki/rpm-gpg/RPM-GPG-KEY-CentOS-7

//不同版本的GPG密钥文件路径可能不同（但名中都包含“GPG-KEY”）

## SRPM

**SRPM（Source RPM）**：提供没有预先编译的RPM打包文件（源代码）

1）SRPM的文件命名格式同RPM，只是后缀名改为“src.rpm”

2）与RPM最不同在于：同时提供参数配置文件（configure和Makefile）

//SRPM提供的是没编译的源代码，所以在安装前还需编译一次生成RPM文件，实现对当前系统的适应（编译的同时会检测该软件相关依赖性是否满足）

### rpmbuild

**rpmbuild命令**：处理SRPM文件

指令格式1：rpmbuild 选项 SRPM文件

选项
含义

--rebuild
将SRPM文件编译并打包成RPM文件

--recompile
将SRPM文件编译打包成RPM文件，并在系统上安装

//若编译出错，编译的中间文件会保留在/tmp对应的文件中等待用户处理

（默认是编译成功后，中间文件自动删除）

**中间文件**：编译过程中临时存放于系统中的各类文件

文件存放路径
说明

/用户家目录/rpmbuild/SPECS
软件的配置文件 （如：软件的参数和设置选项）

/用户家目录/rpmbuild/SOURCES
软件的原始文件和config文件

/用户家目录/rpmbuild/BUILD
软件编译过程中的缓存数据

/用户家目录/rpmbuild/SRPMS
SRPM封装的软件

/用户家目录/rpmbuild/RPMS
编译成功后的RPM文件

//编译完成后，“SPECS、SOURCES和BUILD”默认自动删除（中间文件）,若不编译，直接进行安装，则不会被删除

/用户家目录/rpmbuild/SPECS文件：存放SRPM编译成RPM的主要配置文件

1）命名格式一般为“软件名.sepc”

2）该文件记录了“rpm -q”时所查询的信息

如：查看ntp软件的基本信息

sepc文件编写规则：

1）文件的开头以“Summary”参数为开头进行基础参数说明；

参数
说明

Summary
软件的说明

Name
软件名称

Version
软件版本

Release
该版本软件打包的次数

License
软件的授权模式

Group
软件安装时，指定存放的软件群组

URL
该软件的源代码的官方网站

SourceN
软件的来源（可有多个）

PatchN
软件的补丁patch file（可有多个）

BuildRoot
指定编译时，存放缓存文件的目录

Requires
指定软件安装时，依赖性检测的来源 （可选项）

BuildRequires
指定软件编译时（SRPM编译成RPM）所需的软件 （可选项）

//生成的rpm文件名的构成“Name-Version-Release-Arch.rpm”，其中Arch代表的系统的硬件平台

2）每个不同的段落之间需以“%”为开头

段落
说明

%description
软件的说明 （“rpm -qi 软件名”时显示的内容）

%prep （prepare）
在编译成RPM文件前所进行的任务，如： 1、进行软件的补丁（patch）等工作； 2、查找软件所需目录是否建立和可用； 3、配置软件安装/编译时所需的环境； 4、若系统已存在该软件，则必须备份该软件的相关文件（再安装可能会覆盖原文件）

%build
通过make将源代码编译成可执行的程序 （此部分的程序源代码本质是./configure和make等操作，且SRPM需重新编译，本质是重新配置./configure的参数）

%install
安装过程的各项操作 （类似“make install”）

%files
指定记录软件安装信息的文件 （需指定每个文件的类型）

%changelog
记录软件的曾经更新记录 格式为：* 时间 修改者 emil 软件版本

指令格式2：rpmbuild 选项 spec文件

选项
含义

-ba
编译，且生成RPM和SRPM文件

-bb
编译，且生成RPM文件

SRPM执行步骤：

1）切换到“/用户家目录/rpmbuild/BUILD”；

2）按照spec文件内的Name和Version建立工作目录，并进入（格式为：Name-Version）；

3）在该目录下，针对“/用户家目录/rpmbuild/SOURCES”目录下的文件以tar方式进行解压缩（就是spec文件内的SourceN的指定）；

4）开始“%build”和“%install”；

5）将完成打包的文件放置到对应目录（默认为：/用户家目录/rpmbuild/RPMS/系统硬件平台）

文件格式
文件名格式
直接安装
程序类型
可修改参数

RPM
文件名.rpm
是
已编译
否

SRPM
文件名.src.rpm
否
未编译
是

## YUM

**YUM**：通过分析RPM软件的标头数据，根据各软件的相关性制作出依赖性数据库（系统就可自动处理软件的依赖性问题）

## yum

**yum命令**：根据依赖性数据库解决软件依赖性问题，并安装RPM软件

指令格式1：yum 选项 //查询

选项
含义

list
列出系统所有YUM管理的软件/软件包

search 软件名
查询YUM中与指定软件相关的软件

info 软件名
查询YUM中指定软件详细信息

provides 文件名
查询指定文件属于哪个软件

如：列出当前系统中yum所管理的所有软件/软件包（类似rpm -qa）

内容构成：**软件名 版本号 yum源**

如：查询raid软件和其相关的软件

如：查询vsftpd软件详细信息（类似rpm -qi）

如：查询/bin/sh和/etc/yum.repos.d/local.repo文件属于那个软件（类似rpm -qf）

指令格式2：yum 选项 软件名 **//安装/更新软件**

选项
含义

-y
默认确认（输入y/yes）

install
安装指定软件

update
更新指定软件

check-update
检索出可更新的软件包

--installroot=路径
自定义安装路径

指令格式3：yum 选项 软件名 //卸载软件

选项
含义

remove
卸载软件

指令格式4：yum grouplist //列出软件群组

如：查看当前系统所有可使用的软件群组

指令格式5：yum 选项 软件群组 //管理软件群组

选项
含义

groupinfo
列出指定软件群组的具体信息 （列出安装软件群组中必要的安装的软件）

groupinstall
安装指定软件群组中必要软件

groupremove
移除与指定软件群组相关的所有软件

//软件群组安装中，并不是安装全部软件（仅安装运行该环境所必须的软件）

若安装软件群组中所有软件，可通过修改/etc/yum.conf文件

如：查看“Scientific Support”软件群组的具体信息

## yum源

指令格式6：yum clean 选项 //删除yum源中数据

选项
含义

packages
删除已下载的安装文件

headers
删除已下载的安装文件头

all
删除所有数据

自定义yum源流程：

1）在/etc/yum.repos.d目录下建立文件，后缀名必须为“repo”

//文件名形式为“yum源名.repo”

2）安装yum源配置文件编写规则编写已建立文件，并保存；

规则
含义

[yum源名]
指定yum源名（标识符）

name=
该yum源简介

mirrorlist=
指定该yum源可使用的镜像站 （此行可注释）

baseurl=
指定该yum源获取软件的实际地址

enable=
指定是否启动该yum源 （1为启动，0为关闭）

gpgcheck=
指定是否启动数字签名检测 （1为启动，0为关闭）

gpgkey=
指定数字签名的公钥文件所在位置

//其中baseurl和gpgkey，若为本地文件则“file：//”开头的文件路径，若为网络文件则为http开头的网址

3）“yum clean all”初始化YUM列表

//YUM默认将所有yum源以列表形式记录在/var/cache/yum目录下，所以在添加/更新yum源时都需初始化YUM记录列表

如：利用Centos 7光盘文件配置本地yum源

指令格式7：yum repolist all //查看当前系统所有yum源

1）本质是查看/etc/yum.repos.d目录下后缀名为repo的文件

如：查看当前系统上所有的yum源
