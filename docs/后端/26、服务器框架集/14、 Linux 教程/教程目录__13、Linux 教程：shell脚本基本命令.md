# 13、Linux 教程：shell脚本基本命令
- 来源：https://ddkk.com/zhuanlan/server/linux/1/13.html
- 分类：服务器框架
- 分组：教程目录
## shell脚本基本命令

## 输出命令echo

输出命令echo，基本模式就是`echo [选项] [输出内容]`输出内容如果包含空格，则必须将内容用双引号括起来。选项-e可以使输出语句支持反斜线转义。

加入退格后就不会显示退格符左边的一个字符。ascii码表中有对应的八进制和十六进制表示法，所以可以表示对应的字符。

显示环境变量的值：`echo ${PATH}`或`echo $PATH`，如果一个变量没有被设定，那么就什么都不返回。

颜色输出如将abcd用红色打印：`echo -e "\e[1;31m abcd \e[0m"`其中\e[1的意思是开启颜色输出，而\e[0m是结束颜色输出，31m代表红色，abcd是输出内容，其他颜色如下：

## 第一个脚本与脚本执行方式

新建一个脚本hello.sh:

```java
#!/bin/bash
#the first program
echo "hello world"
exit 0
```

其中第一行是声明，不是注释，不能省略，这是在指定使用哪个shell，如果没有这行有的程序可能无法执行。

第二行#开头的是注释，第四行是命令。

最后一行在设置回传值，在执行完该脚本后，执行`echo $?`就能查看这个值，可以通过这个自定义错误信息。

在脚本中有需要时要重新定义一下PATH环境变量，以便直接使用一些外部命令而不是写绝对路径：

```java
PATH=/usr/lib64/qt-3.3/bin:/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin:/opt/module/jdk1.8.0_144/bin:/opt/module/hadoop-2.7.2/bin:/opt/module/hadoop-2.7.2/sbin:/root/bin
export PATH
```

执行shell脚本要先赋予其可rx权限：`chomd 755 hello.sh`然后再执行`./hello.sh`这里也可以用绝对路径执行。或者用bash命令执行（这种执行方法只要对脚本有r权限就可以执行）：`bash hello.sh`，此时屏幕上就会打印hello world，`sh hello.sh`也一样。也可以将文件放入PATH指定的路径中，直接执行文件名就能运行了。（直接执行一串指令：`sh -c "指令1;指令2"`）

上述几种脚本执行方式都属于直接执行，这些执行方式本质上会使用一个新的bash环境来运行指令，这个子shell不会继承父shell的普通变量，只能继承环境变量，而子shell中定义的变量也不会在父shell中查到，在脚本运行完毕后，子shell中所有的数据都会移除。

另外一种脚本执行方式是source指令，该指令后跟脚本路径就能执行，source执行脚本时不会开启子shell，所以各指令的运行结果都会在原shell中生效，脚本中定义了变量，运行完毕后依然可以查到，所以该命令常常用在修改配置文件后。

写脚本要养成一些良好的习惯，在开头记录一些关键的注释：功能、版本信息、作者及联络方式、历史记录。重要的代码也需要注释。

## 条件判断

判断文件类型：

基本判断格式有两种：`test -e /root/install.log`或`[ -e /root/install.log ]`注意后者方括号内两边都必须有空格（这样处理主要是为了规避正则表达式）。这种判断语句直接执行不会显示正确还是错误，需要执行$?来查看该条命令执行结果。或者可以使用`[ -e /root/install.log ] && echo "yes" || echo "no"`根据打印结果来查看是否执行正确。

判断文件权限：

这种方式只能判断有没有这种权限，而不会区分具体是属主、属组或者other拥有这种权限，想要细分权限需要自定义脚本提取ll命令的打印结果。

两个文件比较：

两个整数之间进行比较：

字符串或变量的判断：

如果先执行`name=sc`再执行`[ -z "$name" ] && echo "yes" || echo "no"`则会输出no，因为此时变量name不为空。如果将$name替换为$不存在的变量，那么结果就为yes。

如果执行`aa=abc`、`bb=abc`，然后再执行[ "$aa" == "$bb" ]结果就为真，[ "$aa" == abc ]结果也为真，但是[ "$aa" == "bb" ]结果为假。

在条件判断式方括号中有一些需要经常遵循的原则：

**1、** 每个组件之间都要用空格隔开（为了防止两边没有空格格式错误）；

**2、** 变量都要用双引号括起来，常量用单引号或双引号括起来；

第二点原则其实和命令中的量用双引号括起来的原因是一样的，一旦出现空格就会发生一些错误，如执行：

`[a b=="$c" ]`，其实不是a b整体和c比较，而是b在和c比较，这个命令会直接报错，应该这样执行：

`["a b"=="$c" ]`

（在bash的判断中使用一个等号和使用两个结构是一样的，但是推荐用两个等号）

多重条件判断：

## if语句

单分支if条件语句：

```java
if [ 条件判断式 ];then
程序
fi
```

或

```java
if [ 条件判断式 ]
then
程序
fi
```

注意if中的条件判断式方括号两边还是要有空格。

在if语句中，方括号和方括号之间也可以加逻辑运算符&&和||，下面两行是等价的：

```java
[ 判断1 -o 判断2 ]
[ 判断1 ] || [ 判断2 ]
```

双分支if条件语句：

```java
if [ 条件判断式 ]
then
条件成立时，执行的程序
else
条件不成立时，执行的另一个程序
fi
```

多分支if条件语句：

```java
if [ 条件判断式1 ] 
	then 
		当条件判断式1成立时，执行程序1 
elif [ 条件判断式2 ] 
	then 
		当条件判断式2成立时，执行程序2 
else 
	当所有条件都不成立时，最后执行此程序
fi
```

### 例1：判断分区使用率

```java
#!/bin/bash
#统计根分区使用率
rate=$(df -h | grep "/dev/sda3" | awk '{print $5}' | cut -d "%" -f1)
#把根分区使用率作为变量值赋予变量rate
if [ $rate -ge 80 ]
	then
		echo "Warning! /dev/sda3 is full!!"
fi
```

这个脚本是基于查看分区情况命令`df -h`的，从输出内容中提取对应分区的对应列，然后去掉%，将值赋值给rate，然后用if语句判断rate的值是否大于80，如果大于就打印警告信息，实际应用中这里应该给管理员发送邮件。

### 例2：备份mysql数据库

```java
#!/bin/bash
#备份mysql数据库。
ntpdate asia.pool.ntp.org &>/dev/null
#同步系统时间
date=$(date +%y%m%d)
#把当前系统时间按照“年月日”格式赋予变量date
size=$(du -sh /var/lib/mysql)
#统计mysql数据库的大小，并把大小赋予size变量
if [ -d /tmp/dbbak ]
	then
		echo "Date : $date!" > /tmp/dbbak/dbinfo.txt
		echo "Data size : $size" >> /tmp/dbbak/dbinfo.txt
		cd /tmp/dbbak
		tar -zcf mysql-lib-$date.tar.gz /var/lib/mysql dbinfo.txt &>/dev/null
		rm -rf /tmp/dbbak/dbinfo.txt
else
	mkdir /tmp/dbbak
	echo "Date : $date!" > /tmp/dbbak/dbinfo.txt
	echo "Data size : $size" >> /tmp/dbbak/dbinfo.txt
	cd /tmp/dbbak
	tar -zcf mysql-lib-$date.tar.gz /var/lib/mysql dbinfo.txt &>/dev/null
	rm -rf /tmp/dbbak/dbinfo.txt
fi
```

首先用if语句判断日志目录/tmp/dbbak是否存在，如果不存在就新建该目录。

将date和size变量都输出到dbinfo.txt文件中，然后将数据库/var/lib/mysql和dbinfo.txt都打包到mysql-lib-$date.tar.gz文件中，这个文件的命名有一部分调用了date的值，这是为了保持压缩文件文件名的唯一性，在打包过程中将命令执行过程中的打印内容全部输出到/dev/null中，相当于删除，&>表示无论语句执行正确与否都将打印内容重定向。打包完成后删掉dbinfo.txt文件。

如果想获取前两天的日期：

```java
date2=$(date --date='2 days ago' +%Y%m%d)
```

文件名也可以单独拿出来拼接，这样可读性更强：

```java
filename=${filename2}${date2}
```

### 例3：判断apache是否启动

```java
#!/bin/bash
port=$(nmap -sT 192.168.1.156 | grep tcp | grep http | awk '{print $2}')
#使用nmap命令扫描服务器，并截取apache服务的状态，赋予变量port
if [ "$port" == "open" ]
	then
		echo “$(date) httpd is ok!” >> /tmp/autostart-acc.log
else
	/etc/rc.d/init.d/httpd start &>/dev/null
	echo "$(date) restart httpd !!" >> /tmp/autostart-err.log
fi
```

nmap命令是判断进程执行的重要命令，提取此命令的打印结果，得到占用状态：

然后根据状态进行if判断，如果已经启动就将已启动输出到日志，如果没有启动就开启该服务，然后将已启动命令输出到日志。

### 例4：判断用户输入的文件类型

```java
#!/bin/bash
#判断用户输入的是什么文件
read -p "Please input a filename: " file
#接收键盘的输入，并赋予变量file
if [ -z "$file" ]
#判断file变量是否为空
	then
		echo "Error,please input a filename"
		exit 1
elif [ ! -e "$file" ]
#判断file的值是否存在
	then
		echo "Your input is not a file!"
		exit 2
elif [ -f "$file" ]
#判断file的值是否为普通文件
	then
		echo "$file is a regulare file!"
elif [ -d "$file" ]
#判断file的值是否为目录文件
	then
		echo "$file is a directory!"
else
		echo "$file is an other file!"
fi
```

先用read命令接受键盘输入，然后将输入赋值给file，用if判断file的类型，这里用exit来跳出多条件if语句，否则如果文件名为空的话还会继续执行下一个条件。

## case语句

case语句和多分支if语句类似，不同之处在于case语句判断的条件关系只有一个。使用格式：

```java
case $变量名 in
	"值1"）
		如果变量的值等于值1，则执行程序1
		;;
	"值2"）
		如果变量的值等于值2，则执行程序2
		;;
	*）
		如果变量的值都不是以上的值，则执行此程序
		;;
esac
```

## function函数

基本格式：

```java
function fname(){
	程序
}
```

fname就是函数名，也是调用时要执行的命令名。

注意在bash中调用函数一定要在定义函数之后，否则会报错。定义好函数后就可以在后续程序中直接调用fname命令，此时就相当于执行代码块。调用该命令时也可以跟后续的参数，第一个参数是$1、第二个参数是$2..，在function中$0代表函数名称，注意在函数内和函数外内建变量的值是不同的。

## for循环

for格式1：

```java
for 变量 in 值1 值2 值3
	do
		程序
	done
```

这种循环的循环次数和in后的值个数相等。in后面可以放：

**1、** 特殊符号，如$(seq1100)代表从1-100这中间的一百个值；

**2、** 多行结果，如cut命令执行的结果；

```java
users=$(cut -d ':' -f1 /etc/passwd)
for username in ${users}
	do
		id ${username}
	done
```

for格式2：

```java
for((初始值;循环控制条件;变量变化))
	do
		程序
	done
```

### 例1：批量解压缩脚本

```java
#!/bin/bash
cd /lamp
ls *.tar.gz > ls.log
for i in $(cat ls.log)
	do
		tar -zxf $i &> /dev/null
	done
rm -rf /lamp/ls.log
```

将文件中的压缩包都重定向到日志文件中，然后把日志文件的内容放在in后，逐个执行解压，最后删除日志文件。

### 例2：for版1到100求和

```java
#!/bin/bash
s=0
for((i=1;i<=100;i=i+1))
	do
		s=$(($s+$i))
	done
echo s
```

### 例3：批量添加用户

```java
#!/bin/bash
read -p "input username :" -t 30 name
read -p "input the number of users: " -t 30 num
read -p "input the password of users: " -t 30 pass
if[ ! -z "$name" -a ! -z "$num" -a ! -z "$pass" ]
	then
		y=$(echo $num | sed 's/[0-9]//g')
			if[ -z "$y" ]
				then
					for((i=1;i<=$num;i=i+1))
						do
							useradd $name$i &> /dev/null
							echo $pass | passwd --stdin $name&i &> /dev/null
						done
			fi
fi
```

首先用户输入用户名name和要添加的用户数量num，还有用户密码pass，然后判断这三个变量是否为空，如果不为空那么就判断num是否为数字，这里用的方法是把num中的数字全部替换为空，然后再检查是否为空。最后开始循环，循环次数就是num，添加用户名时为了保持每个用户名不同设置名字时要加上循环次数，每个用户名为$name&i，设置密码也同理。

## while和until循环

while循环，条件为假时退出循环。

```java
while [ 条件判断式 ] 
	do 
		程序 
	done
```

until循环和while类似，不同之处在于条件为真时退出循环。

```java
until [ 条件判断式 ]
	do
		程序
	done
```

### 例1：while版1到100求和

```java
#!/bin/bash
#从1加到100
i=1
s=0
while [ $i -le 100 ]
#如果变量i的值小于等于100，则执行循环
do
s=$(( $s+$i ))
i=$(( $i+1 ))
done
echo "The sum is: $s"
```

## 脚本的debug

测试脚本是否有语法问题：`sh -n 脚本路径`，如果没有问题则不会显示任何信息。

列出脚本的执行过程：`sh -x 脚本路径`，输出的结果中加号开头的行是指令的执行过程，没有加号的代表打印内容。
