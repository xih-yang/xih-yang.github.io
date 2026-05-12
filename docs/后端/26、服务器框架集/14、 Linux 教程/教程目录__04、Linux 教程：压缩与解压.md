# 04、Linux 教程：压缩与解压
- 来源：https://ddkk.com/zhuanlan/server/linux/1/4.html
- 分类：服务器框架
- 分组：教程目录
## 压缩与解压

压缩是一种很重要的提高磁盘利用空间的手段，数据在网络中传输时也是按照一定的压缩格式传输的，这样就能让带宽的使用率上升。关于压缩有一个很重要的参数被称为**压缩比**，它是压缩后文件/源文件大小。

常见的压缩文件扩展名：（这里的扩展名仅仅是为了区分），第一个compress已经很少使用了。

rar在linux中必须下载特定的工具才能解压压缩，zip在linux中可以直接使用，windows的压缩文件除了zip一般不能在linux中打开，但linux中的压缩包一般都能在windows中打开。

## gzip、zcat/zmore/zless/zgrep

以gzip形式压缩的文件在windows中用winRAR可以直接解压。

以gzip压缩文件：`gzip 文件名`，选项-v可以显示压缩比信息，执行完压缩命令后，源文件就被删除了。

还可以调整压缩比，只需要加-数字选项，代表压缩等级，默认为6，1最快压缩比最高，9最慢压缩比最低。

用重定向方式压缩文件：`gzip -c services > services.gz`，这种方式可以自由指定压缩文件名，而且还可以保留源文件。

解压gzip压缩文件：`gzip -d 压缩文件名`，解压后压缩文件就会被删除。

用zcat/zmore/zless命令可以读取纯文本档被压缩后的压缩文件。

zgrep可以纯文本档压缩文件中直接查找内容，而不用解压，以下内容是查找http关键词：

`zgrep -n 'http' services.gz`

## bzip2、bzcat/bzmore/bzless/bzgrep

bzip2的压缩比要比gzip更好，但用时要长一些。bzip2的用法和gzip几乎完全相同，连选项都一样。

zip也可以压缩文件，但是压缩比不太理想，`zip 压缩后文件名 要压缩的文件`来压缩文件，-r可以压缩目录，保留源文件，对应unzip可以解压文件。

## xz、xzcat/xzmore/xzless/xzgrep

xz的压缩比更高，但是用时更长。

以xz压缩文件：`xz -v 文件名`，-k可以保留源文件建立压缩文件。

列出压缩文件的信息：`xz -l 文件名`

解压缩：`xz -d 文件名`

xzcat/xzmore/xzless/xzgrep也可以直接读、查找文本压缩文档。

## tar

tar也可以压缩文件，且它能对目录执行，`tar -zcvf File.tar.gz dir`就能把目录dir打包成File.tar.gz，z代表打包时压缩，就相当于执行了tar命令再将打包后的文件执行.gz命令，c代表打包，f表示指定文件名，v代表显示打包的信息。相对应的解压命令是`tar -zxvf 压缩文件 -C 解压位置`如果不加后两个就代表解压到当前位置。

tar命令的选项有几种：c为建立压缩文档，v为过程中显示文件名，f表示后面跟文件名。

-zcvf对于gzip格式压缩，用于档名为*.tar.gz；-jcvf用于bzip2解压缩，用于档名为*.tar.bz2；-Jcvf用于xz解压缩，用于档名为*.tar.xz。

把上述命令中的c变成x就是解压的命令，用-C后跟目录来指定解压后位置。

p选项的意思是保留备份数据的原本权限和属性，备份/etc目录：

`tar -zpcv -f /root/etc.tar.gz /etc`

查看tar文件的数据内容：`tar -jtv -f 打包文件名`，此时打包文档内部各文件的权限和属性都会被列出，可以发现其中的文件路径都不带根路径，这是为了解压时能够将文件直接放到对应目录而不是覆盖对应目录。

只解压单一文件的方法，首先查找含有关键字的对应文件：

`tar -jtv -f 压缩文件 | grep '关键字'`，找到该文件名后再执行解压：

`tar -jxv -f 压缩文件 待解开档名`，这个待解开档名开头一般是不含根目录的。

打包目录时将某些文件排除在外，如要打包/etc和/root，但是不想打包/root/etc*文件，且新的打包文件要放置在/root/system.tar.bz2，此时可以执行：

`tar -jcvf /root/system.tar.bz2 --exclude=/root/etc* --exclude=/root/system.tar.bz2 /etc /root`，这里也把新的打包文件除外了，因为压缩文件不能打包自己。

备份比某个时刻新的文件，此时就需要用到--newer-mtime选项，如备份etc目录下所有mtime内容更新时间比2015/06/17靠后的文件：

`tar -jcvf /root/etc.newer.then.tar.bz2 --newer-mtime="2015/06/17" /etc/*`，还有一个选项是--newer，这个选项支持mtime和ctime读取时间。

tar如果仅仅打包文件没有压缩，那么处理后的文件被称为tarfile，如果既打包又压缩，就被称为tarball。

tar可以将文件直接打包到特别的装置中，如磁带机，只需要在打包时将新位置指定到对应地方即可。
