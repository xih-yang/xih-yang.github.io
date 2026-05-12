# 15、Linux 实战：软件安装-Tarball
- 来源：https://ddkk.com/zhuanlan/server/linux/2/15.html
- 分类：服务器框架
- 分组：教程目录
## 安装

Linux系统只能识别并执行二进制程序文件（如：/bin/ls、/usr/bin/passwd）

1）Shell脚本的执行是通过Bash程序和调用其他二进制程序

2）Bash本身也是一个二进制程序

**file命令**：查看文档类型

指令格式：file 文档路径

如：查看/bin/ls、/bin/bash、/etc/passwd和/etc/init.d/network文件类型

## Tarball

**Tarball文件**：将软件的源代码文件以tar打包后，再进行压缩后的文件

1）一般选择gzip格式压缩，所以Tarball文件扩展名一般为“文件名.tar.gz”

//也可为“文件名.tar.bz2”和“文件名.tar.xz”

//Tarball安装是可跨平台进行安装的

Tarball压缩文件一般含有：

1）软件的源代码文件；

2）检测程序文件（configure）；

3）软件的简易说明和安装说明（INSTALL或README）。

Tarball安装流程：

1）获取对应软件版本的Tarball文件；

2）将Tarball在对应目录下解压（产生源代码文件）；

3）编译器（如：gcc）对源代码进行编译（生成后续所需的目标文件）；

4）编译器将函数库、主程序和子程序进行链接（生成主要的二进制程序文件）；

5）将二进制程序文件和相关配置文件安装到系统。

//Tarball一般解压在/usr/local/src目录下

//其中3和4可通过make命令进行简化

如：已有程序源代码后生成可执行二进制程序文件过程

//源码文件名：文件名.c

//执行文件名：文件名.o

**编译**：由源代码生成中间代码文件（目标文件）

1）目标文件和源代码文件都可用来编译而生成二进制程序文件

2）一个软件更新导致重新编译的模块较多时，其相关软件也需重新编译

**链接**：将大量的中间代码文件合成可执行文件

1）目标文件特点：多个目标文件链接生成一个二进制程序文件（程序的链接）

**wget命令**：从指定URL（网址）中下载文档

指令格式：wget 选项 网址

选项
含义

-b
后台下载

-P
指定下载到的目录

-t
指定下载失败时尝试次数（0为无限）

-c
断点续传

-p
下载指定网址中的所有资源

-r
递归下载

### gcc

**gcc命令**：编译源代码文件

指令格式：gcc 选项 源代码文件

选项
含义

-c
仅进行编译生成目标文件（不链接为可执行文件） 产生后缀为“.o”的同名文件

-o 文件路径
指定编译后生成的二进制程序文件

-O
优化编译/链接过程，提高程序执行效率

-O2
较-O选项更好的优化

-Wall
显示具体编译过程和所有信息（默认不显示警告信息）

-l 函数库
指定编译/链接时加入的函数库

-L 目录路径
指定编译/链接时所需函数库所在的目录

-I 目录路径
指定预编译时所需头文件所在的目录

1）Linux默认将函数库存放在/lib和/lib64目录下，所以默认不指定也可编译

//类似-Wall和-O这些非必要参数统称为标识（FLAGS）

由于使用的是C语言，所以也称为CFLAGS

如：编译编码，程序能在屏幕输出“Hello World！”

//若不指定生成的二进制程序文件，默认在执行目录下生成 “a.out”

如：续上，生成目标文件，并以目标文件编译出二进制程序文件

如：利用两个目标文件在屏幕输出“Hello World！ Thank you！”其中hello.o负责主程序，thanks.o负责子程序，最后进行主、子程序链接

//若修改多个目标文件中的其中一些源代码文件，只需重新编译这些被修改的源代码文件并生成新的目标文件，再重新链接目标文件生成新的二进制程序文件

如：优化编译过程和显示编译过程详细信息

如：利用数学公式计算sin 90°（libm.so函数库）

### ./configure

**configure脚本文件**：检测系统环境，并自动生成Makefile文件

执行格式：./configure 选项

1）无选项，则默认将安装路径指定到/usr/local目录下（须在特殊目录下执行）

选项
含义

--prefix=/usr/local/软件名
指定软件安装路径

--with
指定编译时所依赖/添加的文件

--without
指定编译时所不依赖/添加的文件

configure脚本文件执行流程：

1）检测系统已有编译器是否可编译该源代码；

2）检测系统是否存有源代码编译时所需的函数库或其他依赖软件；

3）检测系统平台是否兼容该软件（包括系统的内核版本）；

4）检测内核的头文件是否存在（驱动程序是必须检测的）

**Makefile文件**：由用户自行编写或检测程序编写，记录源代码编译时所需进行的操作、系统环境信息和其他详细信息

Makefile编写规则：

```java
目标（target）:依赖文件1  依赖文件2  依赖文件N
<tab> 命令1
<tab> 命令N
依赖文件1：依赖文件3  依赖文件4  依赖文件N
<tab> 命令1
<tab> 命令N
clean：
<tab> 命令1
<tab> 命令N
```

1）目标与依赖文件之间需以“：”分割，每行的命令行都需以“tab”分隔符开头

2）若依赖文件本身不存在，也可通过Makefile进行生成再调用

3）clean是一个伪目标，并没有所需的依赖文件

//“make clean”（用于清除make命令产生的所有目标文件，以便重新编译）

//Makefile中“#”开头代表注释

如：生成main程序的Makefile

```java
main：main.o insert.o search.o files.o
      gcc -o main  main.o insert.o search.o files.o
main.o：main.c
      gcc -c main.c
files.o：files.c
      gcc -c files.c
clean：
      rm  -rf  main  main.o  insert.o  search.o  files.o
```

Makefile中变量编写规则：

1）变量名以全大写字母命名；

2）变量左边不可有“tab”

3）变量与变量内容以“=”分割，等号两边都需空格；

4）Shell的环境变量可被引用（gcc在编译时会自动调取CFLAGS环境变量）；

5）使用变量方式：${变量名}；

//不同地方定义的CFLAGS的优先级不同，CFLAGS优先级：make命令>Makefile内>Shell变量

//若三者的定义不同，则以优先级高的为准

Makefile中特殊的环境变量：

1）${^}：代表所有依赖文件（空格分隔，不重复包含）；

2）${<}：代表第一个依赖文件的名称；

3）${@}：代表目标的完整名称；

### make

软件都由数量众多的程序文件和链接程序组成，make命令简化软件的该过程

//不会选择手动调用编译器逐个编译完成

**make命令**：在当前目录下根据Makefile进行操作

指令格式：make 选项

1）无选项，则默认根据Makefie文件进行编译生成可被执行的目标文件

2）文件默认存放在当前执行make命令的目录下

3）make只处理文件之间的依赖性，不会因为编译出错等停止工作

选项
含义

clean
初始化编译环境（移除所有目标文件）

install
将编译后的文件安装到指定目录（根据Makefileinstall目标）

//Shell脚本虽然也可进行Makefile中的各种操作，但效果不如make，make可自动判断每个目标文件相关的源代码文件，并直接编译该源代码文件生成目标文件，再进行链接生成二进制程序文件

如：make命令和configure程序流程图

利用make命令安装流程：

1）运行“./configure”：建立Makefile文件；

//一般软件厂商提供该脚本文件，若没有可用户自行编写，若已存在该文件，用户也可添加部分参数

2）运行“make clean”：初始化编译环境；

3）运行“make”：根据Makefile文件的设置进行编译和链接；

4）运行“make install”：将编译和链接后的可执行文件安装到指定目录下

//建议安装软件在“/usr/local”目录下，源代码在“/usr/local/src”目录下

安装后的软件内容大致有：**配置文件**、**函数库**、**可执行文件**、**帮助文件**

其分别存放在：**/usr/local/etc**、**/usr/local/lib**、**/usr/local/bin**、**/usr/local/man**

1）可手动指定安装到指定目录，建议安装形式如：/usr/local/软件名/etc

//便于软件的卸载，但PATH和man需特殊指定

2）PATH需添加：/usr/local/软件名/bin到PATH变量中

3）man需添加：“MANPATH_MAP /usr/local/软件名/bin

/usr/local/软件名/man”到/etc/man_db.conf文件中

**patch命令**：更新已安装软件的源代码文件

指令格式：patch -pN < patch文件路径

1）-pN含义：去除文件路径前的N个“/”

2）根据patch文件将软件的源代码更新，再重新编译该软件，实现软件的更新

3）“patch -R < patch文件路径”则是将已更新的源代码文件还原

4）默认情况下patch文件只针对上一版本进行更新

如：更新文件路径为“/home/guest/example/expatch.old”

```java
1）patch -p0 \< /home/guest/example/expatch.old则更新文件为：/home/guest/example/expatch.old
2）patch -p1 \< /home/guest/example/expatch.old则更新文件为：home/guest/example/expatch.old
3）patch -p4 \< /home/guest/example/expatch.old则更新文件为：expatch.old
```

### 函数库

**静态函数库**：命名格式为“lib函数库名.a”，编译时直接整合到执行程序中

1）编译后的文件较大，但可独立运行

2）函数库升级时，整个执行文件都需重新编译

3）/lib/modules目录：存放系统内核函数库

**动态函数库**：命名格式为“lib函数库名.so”，编译时只添加该库的指针位置

1）不可独立运行（但函数库升级时，也不需重新编译）

2）/etc/ld.so.conf文件：记录系统动态函数库链接

//Linux默认动态函数库存放在/lib和/usr/lib目录下，而/etc/ld.so.conf则记录存放在其他路径下的动态函数库链接

3）/etc/ld.so.cache文件：记录系统中排序好的动态函数库的列表

**ldconfig命令**：更新系统动态函数库

指令格式：ldconfig 选项

1）无选项，则默认遍历/lib和/usr/lib目录和动态库配置文件/etc/ld.so.conf文件中所记录的目录，写入到/etc/ld.so.cache（默认文件，可修改）文件中

选项
含义

-n 文档路径
指定默认遍历文档路径 （替代默认遍历的/lib、/usr/lib和/etc/ld.so.conf所列目录）

-f 文件路径
指定该文件为系统动态函数库配置文件 默认为：/etc/ld.so.conf

-C 文件路径
指定该文件为记录系统函数库数据 默认为：/etc/ld.so.cache

-p
列出当前系统中所有动态函数库的数据内容 （读出/etc/ld.so.cache内的数据）

//在/lib或/usr/lib添加动态函数库时，不需再修改/etc/ld.so.conf文件，只需调用ldconfig使其记录到/etc/ld.so.cache文件中（系统能够找到）

//在/lib和/usr/lib以外目录添加动态函数库时，需将添加至/etc/ld.so.conf文件中

再调用ldconfig使其记录到/etc/ld.so.cache文件中

如：系统安装MySQL在/usr/local/mysql，同时有部分函数库安装在/usr/local/mysql/lib下；这时就需在/etc/ld.so.conf下添加一行“/usr/local/mysql/lib”，再运行ldconfig；（系统就能够在运行MySQL时查找到该部分函数库）

如：更新当前系统动态函数库，并查看已有的动态函数库链接

**ldd命令**：查找指定可执行的二进制程序文件调用的动态函数库

指令格式：ldd 选项 二进制程序文件路径

选项
含义

-v
列出所有内容

-d
列出数据有遗失的连接点

-r
列出ELF有关的错误内容

如：查看ls命令调用的动态函数库

如：查看passwd命令调用的动态函数库的详细信息
