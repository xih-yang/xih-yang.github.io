# 13、Shell 文件包含
- 来源：https://ddkk.com/zhuanlan/other/shell/13.html
- 分类：Shell 教程
- 分组：教程目录
如果shell 要完成的功能比较少，可以把所有的 shell 脚本都写在一个文件里

但如果要完成的功能比较多，错综复杂，那么，把多个功能分隔在多个文件了里是明智之举

多个文件的功能要组合在一起，那么就必须要用到文件包含的机制

和其他语言一样，Shell 也可以包含外部脚本， 这样就可以很方便的把一些共用的代码封装到到独立的文件中

## Shell 使用点号(.)或 source 实现文件包含机制

#### Shell 文件包含的语法格式如下：

```sh
. filename   # 注意点号(.)和文件名中间有一空格
```

或

```sh
source filename
```

### 范例

#### 1. 首先创建两个 shell 脚本文件 demo1.sh 和 demo2.sh

```sh
$ tree shell
shell
├── demo1.sh
└── demo2.sh
0 directories, 2 files
```

#### demo1.sh 代码如下：

```sh
#!/bin/bash
# author:DDKK.COM 弟弟快看，程序员编程资料站(ddkk.cn)
# url:www.ddkk.com
url_home="https://www.ddkk.com"
```

#### demo2.sh 代码如下：

```sh
#!/bin/bash
# author:DDKK.COM 弟弟快看，程序员编程资料站(ddkk.cn)
# url:www.ddkk.com
#使用 . 号来引用 demo1.sh 文件
# . ./demo1.sh
# 或者使用以下包含文件代码
source ./demo1.sh
echo "DDKK.COM 弟弟快看，程序员编程资料站官网地址：$url_home"
```

#### 2. 接下来，为 demo2.sh 添加可执行权限

```sh
$ chmod +x demo2.sh 
```

#### 3. 执行脚本

```sh
 ./demo2.sh
DDKK.COM 弟弟快看，程序员编程资料站官网地址：https://www.ddkk.com
```

> 注意： 被包含的文件 demo1.sh 不需要可执行权限，但需要可读权限

Shell 文件包含机制就是这么简单，一个 点号(.) 或 source 关键字就搞定

## 最佳实战

虽然点号( . ) 或 source 关键字都能实现**文件包含**，但我们推荐使用 source 关键字
