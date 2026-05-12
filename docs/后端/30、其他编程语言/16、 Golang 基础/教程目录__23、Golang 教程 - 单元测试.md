# 23、Golang 教程 - 单元测试
- 来源：https://ddkk.com/zhuanlan/other/golang/2/23.html
- 分类：其他语言
- 分组：教程目录
在提交测试工程师代码前，先进行单元测试自检，没有问题，方可提交代码，对于模块或者函数需要自行写测试用例。

规则：

> 文件名必须以 _test.go 结尾。
> 如果是测试函数，必须以 Test 开头。

## 1. 函数测试

**calc.go**

```java
package main
// 加法
func add(a,b int) int {
    return a + b
}
// 减法
func sub(a,b int) int {
    return a - b
}
```

**calc_test.go**

```java
package main
import "testing"
// 必须是 Test 开头
func TestAdd(t *testing.T) {
    r := add(2,4)
    if r != 6 {
        // 测试异常抛出（类似于 fmt.Printf）
        // t.Fatalf("计算异常，原结果:%d,现结果:%d",6,r)
        t.Fatalf("add(2,4) err,expect:%d,actual:%d",6,r)
    }
    t.Logf("test is success")
}
func TestSub(t *testing.T) {
    r := sub(10,4)
    if r != 6 {
        t.Fatalf("sub(10,4) err,expect:%d,actual:%d",6,r)
    }
    t.Logf("test is success")
}
```

> go test 和 go test -v 看测试信息

## 2. 结构体测试

`student.go`

```java
package main
import (
	"encoding/json"
	"io/ioutil"
)
type student struct {
	Name string
	Sex string
	Age int
}
// 信息保存文件
func (s *student) Save() (err error) {
	// 生成 json 格式
	data,err := json.Marshal(s)	// 编码
	if err != nil {
		return
	}
	// 写入文件
	err = ioutil.WriteFile("stu.txt",data,0755)
	return
}
// 从文件读取信息
func (s *student) Load() (err error) {
	// 从文件读取
	data,err := ioutil.ReadFile("stu.txt")
	if err != nil {
		return
	}
	err = json.Unmarshal(data,s)	// 解码
	return
}
```

`student_test.go`

```java
package main
import "testing"
func TestSave(t *testing.T) {
	// 结构体实例
	stu := &student{
		Name: "zhangsan",
		Sex: "男",
		Age: 18,
	}
	// 测试保存
	err := stu.Save()
	if err != nil {
		t.Fatalf("save stu failed,err:%v",err)
	}
}
// 测试信息获取
func TestLoad(t *testing.T) {
	// 保存
	stu := &student{
		Name: "lisi",
		Sex: "女",
		Age: 20,
	}
	err := stu.Save()
	if err != nil {
		t.Fatalf("save stu failed,err:%v",err)
	}
	// 加载
	stu2 := &student{
     }
	err2 := stu2.Load()
	if err2 != nil {
		t.Fatalf("load stu failed,err:%v",err2)
	}
	// 验证比较数据
	if stu.Name != stu2.Name {
		t.Fatal("stu name different")
	}
	if stu.Sex != stu2.Sex {
		t.Fatal("stu sex different")
	}
	if stu.Age != stu2.Age {
		t.Fatal("stu age different")
	}
}
```

运行结果：

```java
D:\goproject\src\dev_code\test\main>go test -v
=== RUN   TestSave
--- PASS: TestSave (0.00s)
=== RUN   TestLoad
--- PASS: TestLoad (0.00s)
PASS
ok      dev_code/test/main      0.053s
```
