# 05、Linux 基础 - 文件与文件系统压缩
- 来源：https://ddkk.com/zhuanlan/server/linux/4/5.html
- 分类：服务器框架
- 分组：教程目录
## 压缩文件的技术：

计算机中的最小单位是bit，1B=8bit，即一个字节是八个位，这八个位可以是零，可以是一。

压缩，就是要让文件的占用空间的大小变小。

**压缩后与压缩的文件所占用的磁盘空间大小，就可以被称为是压缩比**，更多技术文档可以参考这里：[RFC 1952文件](http://www.ietf.org/rfc/rfc1952.txt)

### Linux系统常见的压缩命令：

在Linux的环境中，压缩文件的扩展名大多是：*.tar、 *.tar.gz、 *.tgz、 *.gz、 *.Z、*.bz2、*.xz，为什么会有这样的扩展名呢？不是说 Linux 的扩展名没有什么作用吗？

这是因为 Linux 支持的压缩命令非常多，且不同的命令所用的压缩技术并不相同，当然彼此之间可能就无法互通压缩/解压缩文件。 所以，当你下载到某个压缩档时，自然就需要知道该文件是由哪种压缩命令所制作出来的，好用来对照着解压缩啊！ 也就是说，虽然 Linux 文件的属性基本上是与文件名没有绝对关系的， 但是为了帮助我们人类小小的脑子，所以适当的扩展名还是必要的！ 底下我们就列出几个常见的压缩文件扩展名吧：

```java
*.Z         compress 程序压缩的文件；
*.zip       zip程序压缩的文件
*.gz        gzip 程序压缩的文件；
*.bz2       bzip2 程序压缩的文件；
*.xz        xz程序压缩的文件
*.tar       tar 程序打包的数据，并没有压缩过；
*.tar.gz    tar 程序打包的文件，并且经过 gzip 的压缩
*.tar.bz2   tar 程序打包的文件，并且经过 bzip2 的压缩
*.tar.xz    tar 程序打包的文件，并且经过 xz的压缩
```

Linux上常见的压缩命令就是 gzip 与 bzip2 以及最新的xz，至于 compress 已经不流行了。 gzip 是由 GNU 计划所开发出来的压缩命令，该命令已经取代了 compress 。 后来 GNU 又开发出 bzip2、xz 这些压缩比更好的压缩命令！不过，这些命令通常仅能针对一个文件来压缩与解压缩，如此一来， 每次压缩与解压缩都要一大堆文件，岂不烦人？此时，那个所谓的打包软件, tar 就显的很重要啦！

这个tar 可以将很多文件打包成为一个文件！甚至是目录也可以这么玩。不过，单纯的 tar 功能仅是打包而已，亦即是将很多文件集结成为一个文件， 事实上，他并没有提供压缩的功能，后来，GNU 计划中，将整个 tar 与压缩的功能结合在一起，如此一来提供使用者更方便并且更强大的压缩与打包功能！ 底下我们就来谈一谈这些在 Linux 底下基本的压缩命令吧！

#### gzip, zcat/zmore/zless/zgrep:

gzip 可以说是应用度最广的压缩命令了！目前 gzip 可以解开 compress, zip 与 gzip 等软件所压缩的文件。至于 gzip 所创建的压缩文件为 *.gz

```java
gzip [-cdtv#]   文件名
zcat 文件名.gz
-c  ：将压缩的数据输出到屏幕上，可通过数据流重定向来处理；
-d  ：解压缩的参数；
-t  ：可以用来检验一个压缩档的一致性，看看文件有无错误；
-v  ：可以显示出原文件/压缩文件的压缩比等信息；
-#  ：压缩等级，-1 最快，但是压缩比最差、-9 最慢，但是压缩比最好！默认是 -6
```

示例：

当你使用gzip压缩时，在默认状态下原本的文件会被压缩成.gz后缀的文件，源文件就不再存在了，这点与Windows不同。此外，使用gzip压缩的文件可以被WinRAR或7zip这些软件解压，很好用。

使用`zcat services.gz`即可以读取services的原始文件内容（此时文件并没有解压）

接下来，我们来解压文件，用`gzip -d 文件名` 即可

我们将解压的services文件用最佳压缩比压缩，并保留原本文件，然后找出这个压缩文件的内容里关键字“http”在哪几行？

上面我们使用-c以将原本要转成压缩文件的数据内容，将它变成文字类型从屏幕输出，然后我们可以通过“>”将原本应该由屏幕输出的数据，转成输出到文件而不是屏幕，所以就能够建立压缩文件（且不销毁源文件）了，只是文件名要自己写。

cat/less/more 可以用不同的方式来读取纯文本文件，那个 zcat/zless/zmore 对应于cat/more/less 的方式来读取纯文本文件被压缩后的压缩文件，由于gzip 这个压缩命令主要想要用来取代 compress 的，所以不但 compress 的压缩文件可以使用 gzip 来解开，同时 zcat 这个命令可以同时读取 compress 与 gzip 的压缩文件！

另外，如果你想要在文字压缩文件当中找数据的话，可以通过 egrep 来查找关键字，而不需要将压缩文件解开然后grep进行。

#### bzip, bzcat/bzmore/bzless/bzgrep:

若说gzip是为了替换compress并提供更好的压缩比而成立的，那么bzip2则是为了替换gzip并提供更加的压缩比而来。bzip2真是很不错的东西，这玩意的压缩比竟然比gzip还要好，至于bzip2的用法几乎与gzip相同,看看下面的用法吧!

```java
bzip2 [-cdkzv#] 文件名
-c: 将压缩的数据输出到屏幕上，可通过数据流重定向来处理;
-d: 解压缩的参数;
-k: 保留原始文件，而不是删除原始文件；
-z: 压缩的参数(默认值，可以不加)；
-v: 可以显示出原文件/压缩文件的压缩比等信息;
-#: 与gzip一样，-9最佳，-1最快
```

后缀是bz2，其他几乎与gzip相同

#### xz, xzcat/xzmore/xzless/xzgrep:

虽然bzip2已经具有很棒的压缩比，不过显然某些自由软件开发者还不满足，因此后来还推出了xz这个压缩比更高的软件。这个软件的用法也跟gzip/bzip2几乎一模一样，那我们就来看一看。

```java
xz [-cdtlk#] 文件名
xzcat 文件名.xz
-c: 将压缩的数据输出到屏幕上，可通过数据流重定向来处理;
-d: 解压缩的参数;
-k: 保留原始文件，而不是删除原始文件；
-l: 列出压缩文件的相关信息；
-t: 测试压缩文件的完整性，看看有没有错误;
-z: 压缩的参数(默认值，可以不加)；
-#: 同样的，调整压缩比
```

重压缩比建议用xz，重压缩速度建议用gzip

## 打包命令-tar：

前面谈到的命令大多仅能针对单一文件来进行压缩，虽然gzip、bzip2、xz也能够针对目录来进行压缩，不过，这几个命令对目录的压缩指的是将目录内的所有文件【分别】进行压缩的操作。而不像在Windows的系统，可以使用类似WinRAR这一类的压缩软件来将好多数据包成一个文件的样式。

这种将多个文件或目录包成一个大文件的命令功能，我们可以称它是一种打包命令，那Linux有没有这种打包命令？有，那就是大名鼎鼎的tar,tar可以将多个目录或文件打包成一个大文件，同时还可以通过gzip、bzip2、xz的支持，将该文件同时进行压缩。更有趣的是，由于tar的使用太广泛了，目前Windows的WinRAR也支持.tar.gz文件名的解压缩。

#### tar

tar的选项与参数特别多，我们只讲几个常用的选项，更多选项您可以自行man tar查询。

```java
tar [-z|-j|-J] [cv] [-f 待建立的新文件名] filename... <== 打包与压缩。
tar [-z|-j|-J] [tv] [-f 既有的tar文件名]  <== 查看文件名
tar [-z|-j|-J] [xv] [-f 既有的tar文件名]  <== 解压缩
-c: 建立打包文件，可搭配-v来查看过程中被打包的文件名(filename);
-t: 查看打包文件的内容含有那些文件名，重点在查看【文件名】；
-x: 解包或解压缩功能，可以搭配-C(大写)在特定目录解压，
   特别留意的是，-c、-t、-x不可同时出现在一串命令行中；
-z: 通过gzip的支持进行压缩/解压缩: 此时文件名最好为*.tar.gz；
-j: 通过bzip2的支持进行压缩/解压缩：此时文件名最好为*.tar.bz2;
-J: 通过xz的支持进行压缩/解压缩: 此时文件名最好为 *.tar.xz，
   特别留意，-z、-j、-J不可以同时出现在一串命令行中；
-v: 在压缩/解压缩的过程中，将正在处理的文件名显示出来;
-f filename: -f后面要立刻接要被处理的文件名,建议-f单独写一个选项(比较不会忘记)。
-C 目录: 这个选项用在解压缩，若要在特定目录解压缩，可以使用这个选项
-p(小写): 保留备份数据的原本权限与属性，常用于备份(-c)重要的配置文件；
-P(大写): 保留绝对路径，亦即允许备份数据中含有根目录存在之意
--exclude=FILE：在压缩过程中，不要将file打包
```

其实最简单的使用tar就只要记住下面的命令即可:

- 压缩: tar -jcv -f filename.tar.bz2 要被压缩的文件或目录名称；
- 查询: tar -jtv -f filename.tar.bz2
- 解压缩: tar -jxv -f filename.tar.bz2 -C 欲解压缩的目录

#### 打包压缩：

示例：

改变一下参数和后缀名，再分别打包压缩一个bz2、xz的

#### 查看tar文件：

加了-v让它一行一行详细显示，不加就只显示文件名了

上面我们会发现所有的文件都没了根目录（/），这是为了安全。tar打包压缩后的文件，一般是要有一天解压的，解压时因为没有根目录，所以都是在解压位置开始的相对路径，如果有根目录，则是绝对路径，会覆盖源目录的

如果就是要做备份，请加上-P参数

#### 解压：

如下即可解压：

想要指定解压路径只要用-C即可

#### 下面列出几个特殊情况：

**若只要解开单一文件：**

先查看出他的文件名即可

**打包某目录，但不含该目录下的某些文件：**

假设我们想要打包 /etc/ /root 这几个重要的目录，但却不想要打包 /root/etc* 开头的文件，而且假设这个新的打包文件要放置成为 /root/system.tar.bz2 ,利用exclude即可，另外还要注意就是还要避开文件自己。

**仅备份比某个时刻还要新的文件：**

某些情况下你会想要备份新的文件而已，并不想要备份旧文件！此时 –newer-mtime 这个选项就很重要啦！ 其实有两个选项啦，一个是“ –newer ”另一个就是“ –newer-mtime ”

当使用newer 时，表示后续的日期包含“ mtime 与 ctime ”，而 –newer-mtime 则仅是 mtime 而已

```java
[root@ddkk.com ~]# find /etc -newer /etc/passwd
[root@ddkk.com ~]# ll --full-time /etc/passwd
-rw-r--r-- 1 root root 1656 2015-11-17 19:15:19.0 +0800 /etc/passwd
[root@ddkk.com ~]# tar -jcv -f /root/etc.newer.then.passwd.tar.bz2 \
> --newer-mtime="2008/09/29" /etc/*
```

**基本名称-tarfile、tarball？**

只打包没有压缩就是tarfile

打包并且进行了压缩就是tarball

此外，tar除了可以将数据打包成为文件之外，还能够将文件打包到某些特别的设备中，例如磁盘（tape）。磁带由于是一次性读取/写入设备，因此我们不能够使用cp来复制。那如果想要将/home、/root、/etc 备份到磁带（/dev/st0）时，就可以使用`tar -cv -f /dev/st0 /home /root /etc`磁带用在备份是很常见的工作

**特殊应用：利用管道命令与数据流**

在tar 的使用中，有一种方式最特殊，那就是通过标准输入输出的数据流重定向(standard input/standard output)， 以及管线命令 (pipe) 的方式，将待处理的文件一边打包一边解压缩到目标目录去。

```java
#将 /etc 整个目录一边打包一边在 /tmp 解开
[root@study ~]# cd /tmp
 [root@study tmp]# tar -cvf - /etc | tar -xvf -
# 这个动作有点像是 cp -r /etc /tmp 依旧是有其有用途的!
# 要注意的地方在于输出文件变成 - 而输入文件也变成 - ，又有一个 |存在~
# 这分别代表 standard output, standard input 与管线命令啦!
# 简单的想法中，你可以将 - 想成是在内存中的一个设备(缓冲区)。 
```

**系统备份范例：**

系统上有非常多的重要目录需要进行备份，而且不建议将备份数据放置到 /root 目录下。

重要目录：

#/root 底下的压缩档也不需要备份

#/home/loop* 不需要备份

/etc/ (配置档)

/home/ (使用者的家目录)

/var/spool/mail/ (系统中，所有帐号的邮件信箱)

/var/spool/cron/ (所有帐号的工作排成配置档)

/root (系统管理员的家目录)

```java
[root@ddkk.com ~]# mkdir /backups
[root@ddkk.com ~]# chmod 700 /backups
[root@ddkk.com ~]# ll -d /backups
drwx------ 2 root root 4096 Feb 19 17:00 /backups
[root@ddkk.com ~]# tar -jcv -f /backups/backup-system-20151119.tar.bz2
--exclude=/root/*.bz2 --exclude=/root/*.gz --exclude=/home/loop* 
/etc /home /var/spool/mail /var/spool/cron /root
```

**解压缩后的SELinux问题（摘录鸟哥原话）：**

如果，如果因为某些缘故，所以你的系统必须要以备份的数据来回填到原本的系统中，那么得要特别注意复原后的系统的 SELinux 问题！ 尤其是在系统文件上面！例如 /etc 底下的文件群。SELinux 是比较特别的细部权限设定，相关的介绍我们会在 16 章好好的介绍一下。 在这里，你只要先知道，SELinux 的权限问题『可能会让你的系统无法存取某些配置文件内容，导致影响到系统的正常使用权』。

这两天(2015/07) 接到一个网友的 email，他说他使用鸟哥介绍的方法透过 tar 去备份了 /etc 的数据，然后尝试在另一部系统上面复原回来。 复原倒是没问题，但是复原完毕之后，无论如何就是无法正常的登入系统！明明使用单人维护模式去操作系统时，看起来一切正常～但就是无法顺利登入。

其实这个问题倒是很常见！大部分原因就是因为 /etc/shadow 这个密码文件的 SELinux 类型在还原时被更改了！导致系统的登入程序无法顺利的存取它， 才造成无法登入的窘境。

那如何处理呢？简单的处理方式有这几个：

**1、** 透过各种可行的救援方式登入系统，然后修改/etc/selinux/config文件，将SELinux改成permissive模式，；

重新启动后系统就正常了；

**2、** 第一次复原系统后，不要立即重新启动！先使用restorecon-Rv/etc自动修复一下SELinux的类型即可；

**3、** 透过各种可行的方式登入系统，建立/.autorelabel文件，重新启动后系统会自动修复SELinux的类型，并；

且又会再次重新启动，之后就正常了！

鸟哥个人是比较偏好第 2 个方法，不过如果忘记了该步骤就重新启动呢？那鸟哥比较偏向使用第 3 个方案来处理，这样就能够解决复原后的 SELinux 问题啰！ 至于更详细的 SELinux ，我们得要讲完程序 (process) 之后，你才会有比较清楚的认知，因此还请慢慢学习，到第 16 章你就知道问题点了

## XFS文件系统的备份与还原：

### XFS文件系统备份-xfsdump：

xfsdump除了进行完整备份外，还可以进行增量备份。例如我们要备份/home，在 /home 里面的文件数据会一直变化。xfsdump第一次备份一定是完整备份，完整备份在 xfsdump 当中被定义为 level 0 。等到第二次备份时，/home 文件系统内的数据已经与 level 0 不一样了，而 level 1 仅只是比较目前的文件系统与 level 0 之间的差异后，备份有变化过的档案而已。至于 level 2 则是与 level 1 进行比较。至于各个 level 的记录文件则放置于 /var/lib/xfsdump/inventory 中。

另外在使用xfsdump时，请注意下面的限制：

- xfsdump 不支援没有挂载的文件系统备份！所以只能备份已挂载的！
- xfsdump 必须使用 root 的权限才能操作 (涉及文件系统的关系)
- xfsdump 只能备份 XFS 文件系统啊！
- xfsdump 备份下来的数据 (文件或存储介质) 只能让 xfsrestore 解析
- xfsdump 是透过文件系统的 UUID 来分辨各个备份档的，因此不能备份两个具有相同 UUID 的文件系统喔！

xfsdump 的选项虽然非常的繁复，不过如果只是想要简单的操作时，您只要记得底下的几个选项就很够用了！

```java
[root@study ~]# xfsdump [-L S_label] [-M M_label] [-l] [-f 备份文件] 待备份数据
[root@study ~]# xfsdump -I
-L  ：xfsdump 会记录每次备份的 session 标头，这里可以填写针对此文件系统的简易说明
-M  ：xfsdump 可以记录储存媒介的标头，这里可以填写此媒体的简易说明
-l  ：是 L 的小写，就是指定等级～有 0~9 共 10 个等级喔！ (预设为 0，即完整备份)
-f  ：有点类似 tar 啦！后面接产生的档案，亦可接例如 /dev/st0 装置文件名或其他一般档案档名等
-I  ：从   /var/lib/xfsdump/inventory 列出目前备份的信息状态
```

你也可以不加-L和-M，只是那就会进入交互模式，要求你回车

我们可以看到，备份之后/var/lib/xfsdump/inventory下有文件产生

我们来看看增量的差异，先看看现在的备份情况并且新建一个10M的文件

上面的生成新文件的流向写错了，应该是流到/data/file/testing.img，不好意思啦

将有了新文件的/data/file备份，然后`xfsdump -I`就可以看到差异了

### XFS文件系统还原xfsrestore：

```java
[root@study ~]# xfsrestore   -I                              <==用来察看备份文件资料
[root@study ~]# xfsrestore [-f 备份档] [-L S_label] [-s] 待复原目录 <==单一档案全系统复原
[root@study ~]# xfsrestore [-f 备份文件] -r 待复原目录    <==透过累积备份文件来复原系统
[root@study ~]# xfsrestore [-f 备份文件] -i 待复原目录    <==进入交互模式
-I  ：跟 xfsdump 相同的输出！可查询备份数据，包括 Label 名称与备份时间等
-f  ：后面接的就是备份文件。企业界很有可能会接 /dev/st0 等磁带机！我们这里接档名！
-L  ：就是 Session 的 Label name 喔！可用 -I 查询到的数据，在这个选项后输入！
-s  ：需要接某特定目录，亦即仅复原某一个文件或目录之意！
-r  ：如果是用文件来储存备份数据，那这个就不需要使用。如果是一个磁带内有多个文件，
      需要这东西来达成累积复原
-i  ：进入互动模式，高级管理员使用的！一般我们不太需要操作它！
```

#### 用xfsrestore观察xfsdump后的备份数据内容：

```java
xfsrestore -I  
```

#### 简单恢复level 0的文件系统：

如果只要恢复一个文件的话，直接加-s这个参数即可

#### 恢复增量备份数据：

接着上面的案例，直接恢复level0后接着恢复level1，以此类推即可

#### 仅还原部分文件的交互模式：

例如`xfsrestore -f /srv/boot.dump -i /tmp/boot3`

跟着提示走即可

## 光盘写入工具（这一部分全部摘抄鸟哥）：

事实上，企业还是挺爱用磁带来进行备份的，容量高、储存时限长、挺耐摔等等，至于以前很热门的 DVD/CD 等，则因为储存速度慢、 容量没有大幅度提升，所以目前除了行政部门为了“归档”而需要的工作之外，这个咚咚的存在性已经被 U盘所取代了。 你可能会谈到说，不是还有蓝光嘛？但这家伙目前主要应用还是在多媒体影音方面，如果要大容量的储存，个人建议，还是使用 USB 外接式硬盘， 一颗好几个 TB 给你用，不是更爽嘛？所以，鸟哥是认为，DVD/CD 虽然还是有存在的价值 （例如前面讲的归档），不过，越来越少人使用了。

虽然很少使用，不过，某些特别的情况下，没有这东西又不行～因此，我们还是来介绍一下创建光盘镜像文件以及烧录软件吧！ 否则，偶而需要用到时，找不到软件数据还挺伤脑筋的！文字模式的烧录行为要怎么处理呢？通常的作法是这样的：

先将所需要备份的数据创建成为一个镜像文件（iso），利用 mkisofs 指令来处理；

将该镜像文件烧录至光盘或 DVD 当中，利用 cdrecord 指令来处理。

### mkisofs（建立镜像文件）：

刻录可启动与不可启动的光盘，使用的方法不太一样

#### 制作一般数据光盘镜像文件：

我们从FTP 站下载下来的 Linux 镜像文件 （不管是 CD 还是 DVD） 都得要继续刻录成为物理的CD/DVD 后， 才能够进一步的使用，包括安装或更新你的 Linux 。同样的道理，你想要利用刻录机将你的数据刻录到 DVD 时， 也得要先将你的数据包成一个镜像文件，这样才能够写入DVD中。而将你的数据制作成一个镜像文件的方式就通过 mkisofs 这个指令即可。mkisofs 的使用方式如下：

```java
[root@study ~]# mkisofs [-o 镜像文件] [-Jrv] [-V vol] [-m file] 待备份文件... \
>   -graft-point isodir=systemdir ...
-o ：后面接你想要产生的那个镜像文件文件名。
-J ：产生较兼容于 Windows 的文件名结构，可增加文件名长度到 64 个 unicode 字符
-r ：通过 Rock Ridge 产生支持 Unix/Linux 的文件数据，可记录较多的信息（如 UID/GID等） ；
-v ：显示创建 ISO文件的过程
-V vol ：创建 Volume，有点像 Windows 在文件资源管理器内看到的 CD 卷标
-m file ：-m 为排除文件 （exclude） 的意思，后面的文件不备份到镜像文件中，也能使用 * 通配符
-graft-point：graft有转嫁或移植的意思，相关数据在下面文章内说明。
```

其实mkisofs 有非常多好用的选项可以选择，不过如果我们只是想要制作“数据光盘”时，上述的选项也就够用了。 **光盘的格式一般称为 iso9660 ，这种格式一般仅支持旧版的 DOS 文件名，亦即文件名只能以 8.3 （文件名8个字符，扩展名3个字符） 的方式存在。**如果加上 -r 的选项之后，那么文件信息能够被记录的比较完整，可包括UID/GID与权限等等！ 所以，记得加这个 -r 的选项。

此外，一般默认的情况下，**所有要被加到镜像文件中的文件都会被放置到镜像文件中的根目录**， 如此一来可能会造成刻录后的文件分类不易的情况。所以，你可以使用 -graft-point 这个选项，当你使用这个选项之后， 可以利用如下的方法来定义位于镜像文件中的目录，例如：

- 镜像文件中的目录所在=实际 Linux 文件系统的目录所在
- /movies/=/srv/movies/ （在 Linux 的 /srv/movies 内的文件，加至镜像文件中的 /movies/目录）
- /linux/etc=/etc （将 Linux 中的 /etc/ 内的所有数据备份到镜像文件中的 /linux/etc/ 目录中）

#### 制作/修改可启动光盘的镜像文件：

```java
[root@study ~]# isoinfo -d -i /home/CentOS-7-x86_64-Minimal-1503-01.iso
CD-ROM is in ISO 9660 format
System id: LINUX
Volume id: CentOS 7 x86_64
Volume set id:
Publisher id:
Data preparer id:
Application id: GENISOIMAGE ISO 9660/HFS FILESYSTEM CREATOR （C） 1993 E.YOUNGDALE （C） ...
Copyright File id:
.....（中间省略）.....
Eltorito defaultboot header:
Bootid 88 （bootable）
Boot media 0 （No Emulation Boot）
Load segment 0
Sys type 0
Nsect 4
# 2\. 开始挂载这片光盘到 /mnt ，并且将所有数据完整复制到 /srv/newcd 目录去
[root@study ~]# mount /home/CentOS-7-x86_64-Minimal-1503-01.iso /mnt
[root@study ~]# mkdir /srv/newcd
[root@study ~]# rsync -a /mnt/ /srv/newcd
[root@study ~]# ll /srv/newcd/
-rw-r--r--. 1 root root 16 Apr 1 07:11 CentOS_BuildTag
drwxr-xr-x. 3 root root 33 Mar 28 06:34 EFI
-rw-r--r--. 1 root root 215 Mar 28 06:36 EULA
-rw-r--r--. 1 root root 18009 Mar 28 06:36 GPL
drwxr-xr-x. 3 root root 54 Mar 28 06:34 images
drwxr-xr-x. 2 root root 4096 Mar 28 06:34 isolinux
drwxr-xr-x. 2 root root 41 Mar 28 06:34 LiveOS
drwxr-xr-x. 2 root root 20480 Apr 1 07:11 Packages
drwxr-xr-x. 2 root root 4096 Apr 1 07:11 repodata
-rw-r--r--. 1 root root 1690 Mar 28 06:36 RPM-GPG-KEY-CentOS-7
-rw-r--r--. 1 root root 1690 Mar 28 06:36 RPM-GPG-KEY-CentOS-Testing-7
-r--r--r--. 1 root root 2883 Apr 1 07:15 TRANS.TBL
# rsync 可以完整的复制所有的权限属性等数据，也能够进行镜像处理！相当好用的指令
# 这里先了解一下即可。现在 newcd/ 目录内已经是完整的镜像文件内容！
# 3\. 假设已经处理完毕你在 /srv/newcd 里面所要进行的各项修改行为，准备创建 ISO 档！
[root@study ~]# ll /srv/newcd/isolinux/
-r--r--r--. 1 root root 2048 Apr 1 07:15 boot.cat 开机的型号数据等等
-rw-r--r--. 1 root root 84 Mar 28 06:34 boot.msg
-rw-r--r--. 1 root root 281 Mar 28 06:34 grub.conf
-rw-r--r--. 1 root root 35745476 Mar 28 06:31 initrd.img
-rw-r--r--. 1 root root 24576 Mar 28 06:38 isolinux.bin 相当于开机管理程序
-rw-r--r--. 1 root root 3032 Mar 28 06:34 isolinux.cfg
-rw-r--r--. 1 root root 176500 Sep 11 2014 memtest
-rw-r--r--. 1 root root 186 Jul 2 2014 splash.png
-r--r--r--. 1 root root 2438 Apr 1 07:15 TRANS.TBL
-rw-r--r--. 1 root root 33997348 Mar 28 06:33 upgrade.img
-rw-r--r--. 1 root root 153104 Mar 6 13:46 vesamenu.c32
-rwxr-xr-x. 1 root root 5029136 Mar 6 19:45 vmlinuz Linux 核心文件
[root@study ~]# cd /srv/newcd
[root@study newcd]# mkisofs -o /custom.iso -b isolinux/isolinux.bin -c isolinux/boot.cat \
> -no-emul-boot -V 'CentOS 7 x86_64' -boot-load-size 4 -boot-info-table -R -J -v -T .
```

此时你就有一个 /custom.img 的文件存在，可以将该光盘烧录出来啰！就这么简单！

#### cdrecord光盘刻录工具：

新版的CentOS 7 使用的是 wodim 这个文字界面指令来进行烧录的行为。不过为了相容于旧版的 cdrecord 这个指令， 因此 wodim 也有链接到 cdrecord 就是了！因此，你还是可以使用cdrecord 这个指令

```java
[root@study ~]# wodim --devices dev=/dev/sr0...     <==查询刻录机的 BUS 位置
[root@study ~]# wodim -v dev=/dev/sr0 blank=[fast|all]   <==抹除重复读写片
[root@study ~]# wodim -v dev=/dev/sr0 -format <==格式化DVD+RW
[root@study ~]# wodim -v dev=/dev/sr0 [可用选项功能] file.iso
--devices ：用在扫瞄磁盘总线并找出可用的烧录机，后续的设备为 ATA 接口
-v ：在 cdrecord 运行的过程中，显示过程而已。
dev=/dev/sr0 ：可以找出此光驱的 bus 位址，非常重要！
blank=[fast|all]：blank 为抹除可重复写入的CD/DVD-RW，使用fast较快，all较完整
-format ：对光盘片进行格式化，但是仅针对 DVD+RW 这种格式的 DVD 而已；
[可用选项功能] 主要是写入 CD/DVD 时可使用的选项，常见的选项包括有：
-data ：指定后面的文件以数据格式写入，不是以 CD 音轨（-audio）方式写入！
speed=X ：指定烧录速度，例如CD可用 speed=40 为40倍数，DVD则可用 speed=4 之类
-eject ：指定烧录完毕后自动退出光盘
fs=Ym ：指定多少缓冲内存，可用在将镜像文件先暂存至缓冲内存。默认为 4m，
一般建议可增加到 8m ，不过，还是得视你的烧录机而定。
针对 DVD 的选项功能：
driveropts=burnfree ：打开 Buffer Underrun Free 模式的写入功能
-sao ：支持 DVD-RW 的格式
```

**检测你的刻录机所在位置：**

文字模式的刻录确实是比较麻烦的，因为没有所见即所得的环境嘛！要刻录首先就得要找到刻录机才行！ 而由于早期的刻录机都是使用 SCSI 接口，因此查询刻录机的方法就得要配合着 SCSI 接口的认定来处理了。 查询刻录机的方式为：

```java
[root@study ~]# ll /dev/sr0
brw-rw----+ 1 root cdrom 11, 0 Jun 26 22:14 /dev/sr0 一般 Linux 光驱文件名！
[root@study ~]# wodim --devices dev=/dev/sr0
-------------------------------------------------------------------------
0 dev='/dev/sr0' rwrw-- : 'QEMU' 'QEMU DVD-ROM'
-------------------------------------------------------------------------
[root@demo ~]# wodim --devices dev=/dev/sr0
wodim: Overview of accessible drives （1 found） :
-------------------------------------------------------------------------
0 dev='/dev/sr0' rwrw-- : 'ASUS' 'DRW-24D1ST'
-------------------------------------------------------------------------
# 你可以发现到其实鸟哥做了两个测试！上面的那部主机系统是虚拟机，当然光驱也是仿真的，没法用。
# 因此在这里与下面的 wodim 用法，鸟哥只能使用另一部 Demo 机器测试给大家看了！
```

因为上面那部机器是虚拟机内的虚拟光驱 （QEMU DVD-ROM），那个无法塞入真正的光盘片啦！真讨厌～所以鸟哥只好找另一部实体 CentOS 7 的主机系统来测试。 因此你可以看到下面那部使用的就是正统的 ASUS 光驱了！这样会查阅了吗？注意喔，一定要有dev=/dev/xxx 那一段，不然系统会告诉你找不到光盘！ 这真的是很奇怪！不过，反正我们知道光驱的文件名为 /dev/sr0 之类的，直接带入即可。

**进行CD/DVD的刻录操作：**

好了，那么现在要如何将 /tmp/system.img 烧录到 CD/DVD 里面去呢？因为要节省空间与避免浪费，鸟哥拿之前多买的可重复读写的 DVD 四倍数 DVD 片来操作！ 因为是可抹除的DVD，因此可能得要在烧录前先抹除 DVD 片里面的数据才行喔！

```java
# 0\. 先抹除光盘的原始内容：（非可重复读写则可略过此步骤）
[root@demo ~]# wodim -v dev=/dev/sr0 blank=fast
# 中间会跑出一堆讯息告诉你抹除的进度，而且会有 10 秒钟的时间等待你的取消！
# 1\. 开始烧录：
[root@demo ~]# wodim -v dev=/dev/sr0 speed=4 -dummy -eject /tmp/system.img
....（前面省略）....
Waiting for reader process to fill input buffer ... input buffer ready.
Starting new track at sector: 0
Track 01: 86 of 86 MB written （fifo 100%） [buf 97%] 4.0x. 这里有流程时间！
Track 01: Total Bytes read/written: 90937344/90937344 （44403 sectors）.
Writing time: 38.337s 写入的总时间
Average write speed 1.7x. 换算下来的写入时间
Min drive buffer fill was 97%
Fixating...
Fixating time: 120.943s
wodim: fifo had 1433 puts and 1433 gets.
wodim: fifo was 0 times empty and 777 times full, min fill was 89%.
# 因为有加上 -eject 这个选项的缘故，因此烧录完成后，DVD 会被退出光驱喔！记得推回去！
# 2\. 烧录完毕后，测试挂载一下，检验内容：
[root@demo ~]# mount /dev/sr0/mnt
[root@demo ~]# df -h /mnt
Filesystem Size Used Avail Use% Mounted on
Filesystem Size Used Avail Use% Mounted on
/dev/sr0 87M 87M 0 100% /mnt
[root@demo ~]# ll /mnt
dr-xr-xr-x. 135 root root 36864 Jun 30 04:00 etc
dr-xr-xr-x. 19 root root 8192 Jul 2 13:16 root
[root@demo ~]# umount /mnt <==不要忘了卸载
```

基本上，光盘烧录的指令越来越简单，虽然有很多的参数可以使用，不过，鸟哥认为，学习上面的语法就很足够了！ 一般来说，如果有刻录的需求，大多还是使用图形界面的软件来处理比较妥当～使用文字界面的刻录，真的大部分都是刻录数据光盘较多。 因此，上面的语法已经足够工程师的使用。

如果你的 Linux 是用来做为服务器之用的话，那么无时无刻的去想“如何备份重要数据”是相当重要的！ 关于备份我们会在第五篇再仔细的谈一谈，这里你要会使用这些工具即可！

## 其他常见的压缩与备份工具：

### dd：

这个命令可不止是制作一个文件而已，这个dd命令最大的功能，应该是在于备份，因为dd可以读取磁盘设备的内容（几乎是直接读取扇区），然后将整个设备备份成一个文件，真的是相当好用，dd的用途有很多，但是我们仅讲一些比较重要的选项，如下：

```java
dd if=”input_file” of=”output_file” bs=”block_size” count=”number”
if：就是input file，也可以是设备
of：就是output file，也可以是设备
bs：设置一个block的大小，未指定则为512Bytes（一个扇区的大小）
count：多少个bs的意思
```

示例：

将/etc/passwd备份到/etc/passwd.back中

我们的文件是2513Bytes，所以占用了四个满块和一个不满块，所以上面是4+1

示例，备份/boot

因为是备份了整个/dev/sda2，所以有1G的大小

默认dd是一个一个扇区去读写的，而且即使没有用到的扇区也会被写入备份文件中，因此这个文件就变得跟原本的磁盘一样大，不像使用xfsdump只备份使用到的部分。不过，dd就是因为不理会文件系统，单纯有啥记录啥，所以不论该磁盘内的文件系统你是否识别，它都可以备份、还原。

你想要将你的 /dev/vda2 进行完整的复制到另一个 partition 上，请使用你的系统上面未分区完毕的容量再创建一个与 /dev/vda2 差不多大小的分区 （只能比 /dev/vda2 大，不能比他小！），然后将之进行完整的复制 （包括需要复制 boot sector 的区块）。答：因为我们的 /dev/sda 也是个测试的 USB 磁盘，可以随意恶搞！我们刚刚也才测试过将光盘镜像文件给它复制进去而已。 现在，请你分区 /dev/sda1 出来，然后将 /dev/vda2 完整的拷贝进去/dev/sda1 吧！

```java
# 1\. 先进行分区的动作
[root@study ~]# fdisk /dev/sda
Command （m for help）: n
Partition type:
p primary （0 primary, 0 extended, 4 free）
e extended
Select （default p）: p
Partition number （1-4, default 1）: 1
First sector （2048-4195455, default 2048）: Enter
Using default value 2048
Last sector, +sectors or +size{K,M,G} （2048-4195455, default 4195455）: Enter
Using default value 4195455
Partition 1 of type Linux and of size 2 GiB is set
Command （m for help）: p
Device Boot Start End Blocks Id System
/dev/sda1 2048 4195455 2096704 83 Linux
Command （m for help）: w
[root@study ~]# partprobe
# 2\. 不需要格式化，直接进行 sector 表面的复制！
[root@study ~]# dd if=/dev/vda2 of=/dev/sda1
2097152+0 records in
2097152+0 records out
1073741824 Bytes （1.1 GB） copied, 71.5395 s, 15.0 MB/s
[root@study ~]# xfs_repair -L /dev/sda1 一定要先清除一堆 log 才行！
[root@study ~]# uuidgen 下面两行在给予一个新的 UUID
896c38d1-bcb5-475f-83f1-172ab38c9a0c
[root@study ~]# xfs_admin -U 896c38d1-bcb5-475f-83f1-172ab38c9a0c /dev/sda1
# 因为 XFS 文件系统主要使用 UUID 来分辨文件系统，但我们使用 dd 复制，连 UUID
# 也都复制成为相同！当然就得要使用上述的 xfs_repair 及 xfs_admin 来修订一下！
[root@study ~]# mount /dev/sda1 /mnt
[root@study ~]# df -h /boot /mnt
Filesystem Size Used Avail Use% Mounted on
/dev/vda2 1014M 149M 866M 15% /boot
/dev/sda1 1014M 149M 866M 15% /mnt
# 这两个玩意儿会“一模一样”喔！
# 3\. 接下来！让我们将文件系统放大吧！！！
[root@study ~]# xfs_growfs /mnt
[root@study ~]# df -h /boot /mnt
Filesystem Size Used Avail Use% Mounted on
/dev/vda2 1014M 149M 866M 15% /boot
/dev/sda1 2.0G 149M 1.9G 8% /mnt
[root@study ~]# umount /mnt
```

非常有趣的示例吧！新分区出来的磁盘分区不需要经过格式化，因为 dd 可以将原本旧的磁盘分区上面，将 sector 表面的数据整个复制过来！ 当然连同 superblock, boot sector, metadata 等等通通也会复制过来！是否很有趣呢？未来你想要创建两颗一模一样的磁盘时， 只要下达类似： dd if=/dev/sda of=/dev/sdb ，就能够让两颗磁盘一模一样，甚至 /dev/sdb 不需要分区与格式化， 因为该指令可以将 /dev/sda 内的所有数据，包括 MBR 与 partition table 也复制到 /dev/sdb 说！ ^_^

话说，用 dd 来处理这方面的事情真的是很方便，你也不需考虑到啥有的没的，通通是磁盘表面的复制而已！不过如果真的用在文件系统上面， 例如上面这个案例，那么再次挂载时，恐怕得要理解一下每种文件系统的挂载要求！以上面的案例来说，你就得要先清除 XFS 文件系统内的 log 之后， 重新给予一个跟原本不一样的 UUID 后，才能够顺利挂载！同时，为了让系统继续利用后续没有用到的磁盘空间，那个 xfs_growfs 就得要理解一下。 关于 xfs_growfs我们会在后续第十四章继续强调！这里先理解即可。

### Cpio：

Cpio可以备份任何东西，包括设备文件，不过cpio有个大问题，就是cpio不会主动地去找文件来备份，那怎么办？所以，一般来说，cpio要配合类似find等可以查找文件的命令来告知cpio该被备份的数据在哪里。有点小麻烦。

```java
cpio -ovcB > [file | device] <==备份
cpio -ivcdu < [file | device] <==还原
cpio -ivct < [file | device] <==察看
备份会用到的选项与参数：
-o ：将数据复制输出到文件或设备上
-B ：让默认的blocks可以增加至 5120 Bytes ，默认是 512 Bytes ！
这样的好处是可以让大文件的储存速度加快（请参考 inodes 的观念）
还原会使用到的选项与参数：
-i ：将数据自文件或设备复制出来系统当中
-d ：自动创建目录！使用 cpio 所备份的数据内容不见得会在同一层目录中，因此我们
必须要让 cpio 在还原时可以创建新目录，此时就得要 -d 选项的帮助！
-u ：自动的将较新的文件覆盖较旧的文件！
-t ：需配合 -i 选项，可用在"察看"以 cpio 创建的文件或设备的内容
一些可共享的选项与参数：
-v ：让储存的过程中文件名称可以在屏幕上显示
-c ：一种较新的 portable format 方式储存
```

**注意这里的find后面为什么是当前目录？即为什么要切过来再用当前目录去查找？这是因为cpio很笨，他不会理会你给的是绝对路径还是相对路径，所以如果你加上绝对路径的开头，那么未来解开的时候，他就一定会覆盖掉原本的/boot，太危险了。**
