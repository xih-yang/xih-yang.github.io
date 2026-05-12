# 19、JavaScript 字符串方法
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/19.html
- 分类：前端框架
- 分组：教程目录
### 字符串获取方法：

#### charAt（‘下标’）：返回单个字符

格式：数组.charAt(下标)

功能：获取item在字符串中的下标，start开始访问的下标，默认从0开始

```java
var res=str.charAt(4)
console.log(res)
```

#### charCodeAt（）

格式：数组.charCodeAt（‘下标’）

功能：返回对应下标的字符的asllc码

```java
var str='hello world'
console.log(str.length,str.charCodeAt(5))//空格Asiic码值位32
```

注：字符串长度包含空格（换行）在内

#### fromCharCode()

格式：String.fromCharCode（asllc值1，asllc值2）；

功能：将传入的asllc值转入对应的字符，并组成新的字符串

```java
var str2=String.fromCharCode(64,95,65,78)
    console.log(str2)
```

### 查找字符串相应字符的方法：

#### indexOf()

格式：字符串.indexOf（item，start）

功能：查找item字符第一次出现的下标，start为开始查找的位置（可忽略，默认是0）

返回值：1.找到：返回字符对应的下标（0<=） 2.没找到：返回-1

#### lastIndexOf()

格式：字符串.lastIndexOf(item，last)

功能：返回item最后一次出现的下标

参数：last时开始查找的位置，查找的下标是从右往左数的

返回值：1.找到：返回字符对应的下标（0<=） 2.没找到：返回-1

```java
var res=str.lastIndexOf('l')
var res=str.lastIndexOf('l',5)
var res2=str.lastIndexOf('a')
console.log(str,res,res2)
```

#### search（）

与indexOf类似,但是不能指定查找的位置，只能找出字符第一次出现的下标。

格式：字符串.search(item)

参数：字符串、正则表达式（与indexOf区别）

功能：找出字符第一次出现的下标

返回值：1.找到：返回字符对应的下标（0<=） 2.没找到：返回-1

```java
var res=str.search('l')
var res2=str.search('a')
console.log(str,res,res2)
```

正则表达式：（仅仅是将引号换成/,然后在最后添加修饰符）

修饰符：i:忽略大小写 g：全局匹配

```java
var str='heLlo world'
var res=str.search('l')
var res2=str.search(/l/i);
console.log(str,res,res2)
```

#### match

格式：字符串.match（正则）

功能：在字符串匹配是否有符合正则表达式

返回值：匹配成功，返回有匹配到的子串的数组

匹配失败，返回null

### 字符串提取方法：

#### substring（）

格式：字符串.substring(start,end)

功能：将字符串中从start下标开始到end之前的这段字符提取出来，并生成新字符串。(包含start,不包含end)。原字符串不改变（字符串只读，无法修改）

返回值：[start，end)组成新字符串

```java
var str='hello world'
var res=str.substring(6,10)
console.log(str,res)
```

#### substr()

格式：字符串.substr(start,count)

功能：提取字符串从start开始，长度为length的新的字符串

返回值：从start开始，长度为length的新的字符串

```java
var str='hello world'
var res=str.substr(6,2)
console.log(str,res)
```

#### slice（）

格式：字符串.slice(start,end)

功能：将字符串中从start下标开始到end之前的这段字符提取出来，并生成新字符串。(包含start,不包含end)。原字符串不改变（字符串只读，无法修改）

返回值：[start，end)组成新字符串

```java
var str='hello world'
var res=str.slice(6,9)
console.log(str,res)
```

#### replace（）替换

格式：字符串.repalce（oldstr，newstr）

功能：用newstr替换oldstr，生成一个新字符串。原字符串不会发生任何变化（字符串自读）

返回值：替换生成的新字符串

注：第一参数传入的是字符串，只能替换一次。

第一个参数传入的是正则表达式，可以全部替换

```java
var str='hello world World world'
var res=str.replace('world','qianduan')
var res2=str.replace(/world/gi,'baby')
console.log('原字符串：'+str,'  新字符串1：'+res,' 新字符串2:'+res2)
```

#### split（）分割

格式：字符串.split(分隔符，length)

参数：

第一个参数：用这个分割符对原字符串进行分割

第二个参数：控制返回的数组的元素个数，一般情况不用

功能：用分隔符对原有的字符串进行分割，将分隔完以后的字串，放在数组中返回

返回值：数组

注：1.相邻的两个分隔符会产生空字符串

**2、** 分隔符是空字符时，直接将每一个字符分割成子串单独返回；

```java
var str='hello world'
var arr=str.split(' ')
console.log(str,arr)
```

**1、** 相邻的两个分隔符会产生空字符串hello和world之间有四个空格；

**2、** 分隔符是空字符时，直接将每一个字符分割成子串单独返回；

**3、** 如果不传参：直接返回原字符串；

#### concat() 拼接（直接使用+更方便）

格式：字符串.concat(字符串1，字符串2，…)

功能：实现字符串拼接

返回值：拼接后的字符串

```java
var str='hello'
			var newstr=str.concat('world','!!!')
			console.log(str,newstr)
```

toLowerCase():转成全小写

toUperCase（）：转成全大写

以下方法了解即可：

#### 练习：

**1、** str='Imetahandsomeguy,buthehasagirlfriend;OH’提取guy到grilfriend中间部分字符串；

**2、** 已知一段字符串包含大小写字母的单词，除了保留首单词的开头字母大写，其他都是小写，每个单词之间用空格隔开；

**3、** 验证码：；

**1、** 纯数字验证码非常容易破解6位数字验证码；

**2、** 数字和字符组成的验证码；

**4、** 将字符串按照单词进行逆序，空格作为划分单词的唯一条件；

传入：'Welecom to Beijing’改为 ’‘Beijing to Welcom"

```java
	var str="Welcome to Beijing"
			function reverse(str){
				var arr=str.split(' ')
				var newarr=arr.reverse()
				console.log(newarr.join(' '))
			}
			reverse(str)
```

**5、** 对称数组；

传入一个数组，元素类型与个数位置，返回新数组，由原数组的元素正序逆序拼接而成。

传入[‘One’,‘Two’,‘Three’]

返回[‘One’,‘Two’,‘Three’,’‘Three’,‘Two’,‘One’]

```java
var arr=['One','Two','Three']
			function symmetry(arr){
				var arr2=arr.concat()
				var newarr=arr.concat(arr2.reverse())
				console.log(newarr,arr)
			}
			symmetry(arr)
```
