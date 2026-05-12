# 03、Oracle 基础教程 - Oracle字符集
- 来源：https://ddkk.com/zhuanlan/db/oracle/3/3.html
- 分类：缓存数据库
- 分组：教程目录
## 1. 字符集定义

**字符集（Character Set）** ：按照一定的**字符编码方案**，将特定的符号集编码为计算机能够处理的数值的集合。

常见字符集名称：ASCII字符集、Unicode字符集、GB2312字符集、BIG5字符集、 GB18030字符集等。

每个字符集包含的字符个数不同，在字符集转换过程中，如果源字符集中的某个字符在目标字符集中没有定义，将会出现信息丢失。

字符编码（Character Encoding）：是一套规则，能够使自然语言字符的一个集合（如字母表或音节表），与其他的一个集合（如号码或电脉冲）进行配对。即在符号集合与数字系统之间建立对应关系，因此**字符编码就是将语言符号转换为计算机可以接受的数字系统的数值**。

如，Unicode是字符集，UTF-8、UTF-16、UTF-32是三种字符编码方案。

## 2. 常见字符集

**（1）ASCII（American Standard Code for Information Interchange，美国信息互换标准编码）** ，单字节编码系统，7位（bits）表示一个字符，共128字符，字符值从0到127，其中32到126是可打印字符。ASCII字符集包括控制字符：回车键、退格、换行键等；可显示字符：英文大小写字符、阿拉伯数字和西文符号。

**（2）Unicode( Universal Multiple-Octet Coded Character Set，通用多八位编码字符集)**，为每种语言中的每个字符设定了统一并且唯一的二进制编码，以满足跨语言、跨平台进行文本转换、处编码方法。Unicode 标准使用十六进制、4字节的数字来表达每个字母、符号，或者表意文字，而且在书写时在前面加上前缀“U+”。

**Unicode是字符集，有UTF-8、UTF-16、UTF-32是三种字符编码方案**。

**UTF-8（8-bit Unicode Transformation Format）是Unicode的8位可变长度字符编码方式**，也是一种前缀码，AL32UTF8，UTF8、UTFE是UTF-8编码字符集。UTF-8使用1至4个字节为每个字符编码，可以用来表示Unicode标准中的任何字符，且其编码中的第一个字节仍与ASCII兼容，因此UTF-8是ASCII的一个超集，一个纯ASCII字符串也是一个合法的UTF-8字符串。互联网工程工作小组（IETF）要求所有互联网协议都必须支持UTF-8编码，在HTTP中，与字符集和字符编码相关的消息头是Accept-Charset/Content-Type。

**UTF-16（16-bit Unicode Transformation Format）是unicode的16位编码方式**，是一种定长多字节编码，用2个字节表示一个unicode字符，AF16UTF16是UTF-16编码字符集。

**（3）ANSI码（American National Standards Institute，美国国家标准学会的标准码）** ，不同国家和地区制定了不同的标准，由此产生了 GB2312， BIG5， JIS 等各自的编码标准。这些使用 2 个字节来代表一个字符的各种汉字延伸编码方式，称为 ANSI 编码。在简体中文系统下，ANSI 编码代表 GB2312 编码，在日文操作系统下，ANSI 编码代表 JIS 编码。 不同 ANSI 编码之间互不兼容，当信息在国际间交流时，无法将属于两种语言的文字，存储在同一段 ANSI 编码的文本中。记事本程序默认以ANSI编码保存文档。

**（4）GB2312（《GB 2312-1980信息交换用汉字编码字符集 基本集》）** ，是中国国家标准的简体中文字符集。一个小于127的字符意义与原来相同，但两个大于127的字符连在一起时，就表示一个汉字，高字节从0xA1到0xF7，低字节从0xA1到0xFE，可以组合出大约7000多个简体汉字，覆盖了汉字99.75%的使用频率，基本满足了汉字的计算机处理需要，在中国大陆和新加坡广泛使用。

**GBK是GB-2312-80的扩展**，是微软利用GB-2312-80未利用的编码空间，收录GB13000.1-93全部字符制定的编码，最早实现于Windows 95简体中文版。

**GB-18030（GB 18030-2005《信息技术 中文编码字符集》）** ，最新的内码字集，是GB 18030-2000 《信息技术 信息交换用汉字编码字符集 基本集的扩充》的修订版，与GB 2312-1980完全兼容，与GBK基本兼容，支持GB 13000及Unicode的全部汉字，共收录汉字70244个，主要有以下特点：

与UTF-8相同，采用多字节编码，每个字可以由1个、2个或4个字节组成。

编码空间庞大，最多可定义161万个字符。

支持中国国内少数民族的文字，不需要动用造字区。

汉字收录范围包含繁体汉字以及日韩汉字

**（5）Big5，大五码或五大码，是使用繁体中文（正体中文）社区中最常用的电脑汉字字符集标准**，共收录13，060个汉字。中文码分为内码及交换码两类，Big5属中文内码，知名的中文交换码有CCCII、CNS11643。Big5码是一套双字节字符集，使用了双八码存储方法，以两个字节来安放一个字。第一个字节称为"高位字节"，第二个字节称为"低位字节"。"高位字节"使用了0x81-0xFE，"低位字节"使用了0x40-0x7E，及0xA1-0xFE。

## 3. Oracle字符集

Oracle的字符集命名遵循以下命名规则:

>

即: ****

比如:ZHS16GBK表示采用GBK编码格式、16位（两个字节）简体中文字符集

WE8ISO8859P1(西欧、8位、ISO标准8859P1编码)

### 3.1 Oracle Server端字符集

创建数据库时，需要选择字符集与国家字符集（通过`create database`中的`CHARACTER SET`与`NATIONAL CHARACTER SET`子句指定）。

如果只需存储英文，选择US7ASCII作为字符集就可以；如果要存储中文，需选择能够支持中文的字符集（如ZHS16GBK）；如果存储多国语言文字，要选择UTF8。

数据库字符集的确定，实际上说明这个数据库所能处理的字符的集合及其编码方式，**由于字符集选定后再进行更改会有诸多的限制，所以在数据库创建时一定要考虑清楚后再选择**（默认的字符集，如WE8ISO8859P1或US7ASCII都没有汉字编码）。

可通过查询数据字典或`v$`视图查看Oracle Server端字符集

查询语句如下：

```java
SQL>select userenv(‘language’) from dual;
SQL>select * from nls_database_parameters where parameter='NLS_CHARACTERSET'
SQL>select * from v$nls_parameters where parameter='NLS_CHARACTERSET';
```

- NLS_DATABASE_PARAMETERS：来源于props`$`，显示数据库当前NLS参数取值，包括数据库字符集取值；
- NLS_INSTANCE_PARAMETERS：来源于v`$`parameter，表示服务端的字符集的设置，可能是参数文件，环境变量或者是注册表；
- NLS_SESSION_PARAMETERS：来源于v`$`nls_parameters，表示会话自己的设置，可能是会话的环境变量或者是alter session改变后的参数值（不包括由NLS_LANG 设置的客户端字符集）。如果会话没有特殊的设置，将与nls_instance_parameters一致；
- V`$`NLS_PARAMETERS：显示数据库当前NLS参数取值。

**如果需要修改字符集，通常需要导出数据库数据，重建数据库，再导入数据库数据的方式来转换**。

创建数据库后修改字符集是有限制的，只有新的字符集是当前字符集的超集时才能修改数据库字符集。

当一种字符集（字符集A）的编码数值包含所有另一种字符集（字符集B）的编码数值，并且两种字符集相同编码数值代表相同的字符时，则字符集A是字符集B的超级，或称字符集B是字符集A的子集。

例如UTF8是US7ASCII的超集，修改数据库字符集可使用如下语句：

```java
SQL>ALTER DATABASE CHARACTER SET UTF8
```

### 3.2 Oracle Client端字符集

客户端字符集定义了客户端字符数据的编码方式，任何发自或发往客户端的字符数据均使用客户端定义的字符集编码，客户端可以看作是能与数据库直接连接的各种应用，例如**sqlplus**、**exp/imp**等。

客户端字符集是通过设置`NLS_LANG`参数来设定的，`NLS_LANG`由以下部分组成：

> \_.

如：AMERICAN _ AMERICA. ZHS16GBK。

- Language： 指定消息的语言， 影响提示信息是中文还是英文-
- Territory： 指定默认的日期和数字格式，
- Clients Characterset： 指定字符集，本意就是用来指明客户端操作系统缺省使用的字符集。所以按正规的用法，NLS_LANG应该按照客户端机器的实际情况进行配置， **真正影响数据库字符集的是第三部分**。两个数据库之间的字符集只要第三部分一样就可以相互导入导出数据，前面影响的只是提示信息是中文还是英文。

NLS作用优先级别：

> Sql function > alter session > 环境变量或注册表 > 参数文件 > 数据库默认参数

查询oracle client端的字符集

Windows:

```java
set nls_lang
```

Unix:

```java
echo $NLS_LANG
```

如果检查发现server端与client端字符集不一致，需要统一修改为同server端相同的字符集。

Windows:

```java
set NLS_LANG=AMERICAN_AMERICA.ZHS16GBK
```

或者修改注册表：Regedit.exe –>HKEY_LOCAL_MACHINE->SOFTWARE->ORACLE-HOME

Unix:

```java
export NLS_LANG=AMERICAN_AMERICA.ZHS16GBK
```

或者编辑oracle用户的profile文件

### 3.3 Oralce导入/导出 字符集

在用exp导出数据的时候，imp导入时需要注意ORACLE字符集问题，数据从源数据库到目标数据库的过程中有四个环节涉及到字符集，分别是

- （1）源数据库字符集
- （2）Export过程中用户会话字符集（通过NLS_LANG设定）
- （3）Import过程中用户会话字符集（通过NLS_LANG设定）
- （4）目标数据库字符集

以上涉及三方面的字符集：

- oracel server端的字符集
- oracle client端的字符集
- dmp文件的字符集

在数据导入的时候，需要这三个字符集都一致才能正确导入。

用oracle的exp工具导出的dmp文件也包含了字符集信息，dmp文件的第2和第3个字节记录了dmp文件的字符集。

如果dmp文件不大，比如只有几M或几十M，可以用UltraEdit打开(16进制方式)，看第2第3个字节的内容，如0354，然后用以下SQL查出它对应的字符集：

```java
SQL> select nls_charset_name(to_number('0354'，'xxxx')) from dual;
ZHS16GBK
```

如果dmp文件很大，比如有2G以上(这也是最常见的情况)，用文本编辑器打开很慢或者完全打不开，可以用以下命令(在unix主机上):

```java
cat exp.dmp |od -x|head -1|awk '{print $2 $3}'|cut -c 3-6
```
