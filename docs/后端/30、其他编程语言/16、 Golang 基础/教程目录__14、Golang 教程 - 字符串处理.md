# 14、Golang 教程 - 字符串处理
- 来源：https://ddkk.com/zhuanlan/other/golang/2/14.html
- 分类：其他语言
- 分组：教程目录
## 1. 字节数组

字符是人的语言（文本：字符串），字节是机器的语言（图片，音频，视频 …），它们之间通过 ASCII 码互相翻译，一个英文字符等于一个字节，一个中文字符等于二个字节（UTF-8）。

```java
package main
import "fmt"
func main() {
    var (
        str1 = "hello"
        str2 = "world" 
    )
    str3 := str1 + " " + str2
    fmt.Printf("数据 %s 长度 %d\n",str3,len(str3))
    fmt.Printf("数据 %s 类型 %T\n",str3)
    fmt.Println()
    // 字符串转换成字节数组
    tmp := []byte(str3)
    fmt.Printf("数据 %s 长度 %d\n",tmp,len(tmp))
    fmt.Printf("数据 %s 类型 %T\n",tmp)
    for i:=0;i<len(tmp);i++ {
        fmt.Println(tmp[i])
    }
    // 字节数转组字符串
    fmt.Println("字节数组转字符串：",string(tmp))
    fmt.Println()
    // 反转函数调用
    fmt.Println("反转：",Reverse(str3))
}
// 反转
func Reverse(str string) string {
    var (
        result string
        leng int = len(str)
    )
    for i := leng - 1; i >= 0; i-- {
        // Sprintf 转换数据类型为 string，使用 + 进行拼接
        // 重点：Sprintf 将任意类型转换成字符串
        result = result + fmt.Sprintf("%c", str[i])
    }
    return result
}
// for i:=0;i<leng;i++ {
//    result = result + fmt.Sprintf("%c",str[leng-i-1])
// }
// 结果
数据 hello world 长度 11
数据 hello world 类型 %!T(MISSING)
数据 hello world 长度 11
数据 hello world 类型 %!T(MISSING)
104
101
108
108
111
32
119
111
114
108
100
字节数组转字符串： hello world
反转： dlrow olleh
```

## 2. 头尾处理

**示例：**

- 判断字符串 s 是否以 prefix 开头，判断 URL 是否以 http:// 开头，如果不是，则加上 http://。
- 判断字符串 s 是否以 suffix 结尾，判断路径是否以 / 结尾，如果不是，则加上 / 结尾。

```java
package main
import (
    "fmt"
    "strings"
)
func main() {
    var (
        url string
        path string
    )
    fmt.Scanf("%s%s",&url,&path)	// 空格输入第二个参数
    fmt.Println(urlProcess(url))
    fmt.Println(pathProcess(path))
}
// 头部是否包含 http://，不包含添加
func urlProcess(url string) string {
    // 返回的 result 类型是 bool
    result := strings.HasPrefix(url,"http://")
    if !result {
        url = fmt.Sprintf("http://%s",url)
    }
    return url
}
// 尾部是否包含 /，不包含添加
func pathProcess(path string) string {
    // 返回的 result 类型是 bool
    result := strings.HasSuffix(path,"/")
    if !result {
        path = fmt.Sprintf("%s/",path)
    }
    return path
}
// 结果
www.baidu.com /root/bin
http://www.baidu.com
/root/bin/
```

## 3. 位置索引

示例：判断子字符串在字符串中首次出现的位置和最后出现的位置。

```java
package main
import (
    "fmt"
    "strings"
)
func main() {
    var (
        s string = "adadascdadasacdsda"
        str string = "cd"
    )
    start := strings.Index(s,str)
    fmt.Println("关键词首部出现的位置：",start)
    end := strings.LastIndex(s,str)
    fmt.Println("关键词尾部部出现的位置：",end)
}
```

```java
关键词首部出现的位置： 6
关键词尾部部出现的位置： 13
```

## 4. 替换

```java
package main
import (
    "fmt"
    "strings"
)
func main() {
    var (
        s string = "adadascdadasacdsda"
        str string = "cd"
    )
    // 替换 Replace(原字符串，原字段，新字段，替换次数)
    // -1 表示全文替换，0 表示不替换
    result := strings.Replace(s,str,"CD",-1)
    fmt.Println(result)
}
```

```java
adadasCDadasaCDsda
```

## 5. 统计次数

```java
package main
import (
    "fmt"
    "strings"
)
func main() {
    var (
        s string = "adadascdadasacdsda"
        str string = "cd"
    )
    // 使用 count 统计关键字在字符串中出现的次数
    count := strings.Count(s,str)
    fmt.Println("cd 出现的次数：",count)
}    
```

```java
cd 出现的次数： 2
```

## 6. 重复

```java
package main
import (
    "fmt"
    "strings"
)
func main() {
    var (
        str string = "cd"
    )
    // 复制关键字段 3 次并返回完整字符串
    result := strings.Repeat(str,3)
    fmt.Println(result)
}    
```

```java
cdcdcd
```

## 7. 大小写

```java
package main
import (
    "fmt"
    "strings"
)
func main() {
    var (
        str string = "abc"
    )
    // 字符串变大写
    result1 := strings.ToUpper(str)
    fmt.Println(result1)
    // 字符串变小写
    result2 := strings.ToLower(result1)
    fmt.Println(result2)
}    
```

```java
ABC
abc
```

## 8. 去除字符

**去除首尾空白字符**

```java
package main
import (
    "fmt"
    "strings"
)
func main() {
    var (
        str string = "  abc "
    )
    fmt.Println("原长度：",len(str))
    // 去除首尾空白字符
    result := strings.TrimSpace(str)
    fmt.Println(result)
    fmt.Println("现长度：",len(result))
}    
```

```java
原长度： 6
abc
现长度： 3
```

**去除首尾和指定位置字符**

```java
package main
import (
    "fmt"
    "strings"
)
func main() {
    var (
        str string = "this is abc web"
    )
    fmt.Println("原长度：",len(str))
    /* 去除首尾空白字符
    result := strings.TrimSpace(str)
    fmt.Println(result)
    fmt.Println("现长度：",len(result))
    */
    // 去除首尾匹配关键字
    result1 := strings.Trim(str,"this")
    fmt.Println(result1)
    fmt.Println("现长度：",len(result1))
}   
```

```java
原长度： 15
 is abc web
现长度： 11
```

**TrimLeft/TrimRight**

- TrimLeft 从左匹配关键字符，进行删除，直到没有匹配上的字符为止，即使后面有匹配字符也不会被删除。
- TrimRight 从右匹配关键字符，进行删除，直到没有匹配上的字符为止，即使后面有匹配字符也不会被删除。

```java
package main
import (
    "fmt"
    "strings"
)
func main() {
    var (
        str string = "this is abc web"
    )
    //T
    result3 := strings.TrimLeft(str,"thisa ")
    fmt.Println(result3)
    result4 := strings.TrimRight(str,"_isweb ")
    fmt.Println(result4)
} 
```

```java
bc web
this is abc
```

## 9. 切片处理

字符串以空格分割转换成切片。

```java
package main
import (
    "fmt"
    "strings"
)
func main() {
    var s string = "abc def hig"
    // 转换切片，默认识别空格分隔
    result := strings.Fields(s)
    fmt.Printf("数据类型 %T\n内容是 %v\n",result,result)
    for i:=0;i<len(result);i++ {
        fmt.Println(result[i])
    }
}
```

```java
数据类型 []string
内容是 [abc def hig]
abc
def
hig
```

**Split 识别其他特殊符号分割**

```java
package main
import (
    "fmt"
    "strings"
)
func main() {
    var s string = "abc:def:hig"
    // 转换切片，默认识别空格分隔
    result1 := strings.Split(s,":")
    fmt.Printf("数据类型 %T\n内容是 %v\n",result1,result1)
}    
```

```java
数据类型 []string
内容是 [abc def hig]
```

**切片转换成字符串**

```java
package main
import (
    "fmt"
    "strings"
)
func main() {
    var s string = "abc def hig"
    result1 := strings.Split(s," ")
    fmt.Printf("数据类型 %T\n内容是 %v\n",result1,result1)
    // 
    str := strings.Join(result1,",")
    fmt.Printf("数据类型 %T\n内容是 %v\n",str,str)
}    
```

```java
数据类型 []string
内容是 [abc def hig]
数据类型 string
内容是 abc,def,hig
```

## 10. 数值处理

- 数值转换成字符串。

`方法一`

```java
package main
import (
    "fmt"
    "strconv"
)
func main() {
    var num int = 123456
    fmt.Printf("num 数据类型 %T\n",num)
    // 数值转换成字符串
    result := strconv.Itoa(num)
    fmt.Printf("result 数据类型 %T\n",result)
    fmt.Println(result)
}
// 结果
num 数据类型 int
result 数据类型 string
123456
```

`方法二`

```java
// 使用 sprintf 函数处理
package main
import (
    "fmt"
)
func main() {
    var num int = 123456
    fmt.Printf("num 数据类型 %T\n",num)
    // 使用 Sprintf() 转换字符串，可以实现多类型转化
    result := fmt.Sprintf("%d",num)
    fmt.Printf("result 数据类型 %T\n",result)
}
// 结果
num 数据类型 int
result 数据类型 string
```

- 字符串转换成数值。

```java
package main
import (
    "fmt"
    "strconv"
)
func main() {
    var str string = "123456"
    // 字符串转整数
    result, err := strconv.Atoi(str)
    if err == nil {
        fmt.Printf("数据类型 %T\n",result)
    } else {
        fmt.Println(err)
    }
}
// 结果
数据类型 int
```
