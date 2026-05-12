# 24、Golang 教程 - TCP 编程
- 来源：https://ddkk.com/zhuanlan/other/golang/2/24.html
- 分类：其他语言
- 分组：教程目录
客户端和服务器模型

socket：BSD UNIX 的进程通信机制，通常也称作套接字，用于描述 IP 地址和端口，是一个通信链的句柄。socket 可以理解为 TCP/IP 网络的 API，它定义了许多函数，程序员可以使用它来开发 TCP/IP 网络的应用程序。计算机上运行对的应用程序通常通过**套接字**向网络发出请求或者应答网络请求。

**服务端处理流程：**

```java
1. 监听端口
2. 接收客户端连接
3. 创建 goroutine，处理此连接
```

**客户端处理流程：**

```java
1. 建立与服务端连接
2. 进行数据收发
3. 关闭连接
```

`apcahe 是同步模型，nginx 是异步模型。`

## 1. 服务器端配置

一个服务端连接多个客户端，例如：世界各地的用户使用自己电脑的浏览器访问淘宝网。

`示例`

```java
package main
import (
	"fmt"
	"net"
)
/* TCP 服务端 */
// 处理客户端连接函数
func process(conn net.Conn) {
	defer conn.Close()
	var buf [1024]byte
	n,err := conn.Read(buf[:])	// 读取切片数据
	if err != nil {
		fmt.Println("read err:",err)
		return
	}
	str := string(buf[:n])	// 转换字符串
	fmt.Println("收到客户端发来的数据:",str)
}
func main() {
	// 1. 监听端口
	listener,err := net.Listen("tcp","127.0.0.1:20000")
	// 连接失败处理
	if err != nil {
		fmt.Println("启动服务失败,err:",err)
		return
	}
	// 程序退出时释放端口
	defer listener.Close()
	for {
		// 2. 建立连接
		// conn 是返回的接口
		conn,err := listener.Accept()
		if err != nil {
			fmt.Println("接收客户端连接失败,err",err)
			continue	// 继续阻塞，等待客户端再次连接
		}
		// 3. 启动一个 goroutine 处理客户端连接
		go process(conn)
	}
}
```

## 2. 客户端配置

```java
package main
import (
	"fmt"
	"net"
)
/* TCP 客户端配置 */
func main() {
	// 1. 拨号方式建立与服务端连接
	conn,err := net.Dial("tcp","127.0.0.1:20000")
	if err != nil {
		fmt.Println("连接服务端失败,err:",err)
		return
	}
	// 注意：关闭连接位置，不能写在连接失败判断上面
	defer conn.Close()
	// 2. 向 server 发送信息
	// fmt.Fprintln(conn,"hello")
	_,err = conn.Write([]byte("hello,tom"))
	if err != nil {
		fmt.Println("发送消息失败,err:",err)
		return
	}
}
```

## 3. 运行结果

## 4. 优化聊天模式

修改客户端

```java
package main
import (
	"bufio"
	"fmt"
	"net"
	"os"
)
/* TCP 客户端配置 */
func main() {
	// 1. 拨号方式建立与服务端连接
	conn,err := net.Dial("tcp","127.0.0.1:20000")
	if err != nil {
		fmt.Println("连接服务端失败,err:",err)
		return
	}
	// 注意：关闭连接位置，不能写在连接失败判断上面
	defer conn.Close()
	// 从标准输入获取内容
	reader := bufio.NewReader(os.Stdin)
	// 按行读取内容
	input,err := reader.ReadString('\n')
	if err != nil {
		fmt.Println("获取信息失败,err:",err)
		return
	}
	// 2. 向 server 发送信息
	// fmt.Fprintln(conn,"hello")
	_,err = conn.Write([]byte(input))
	if err != nil {
		fmt.Println("发送消息失败,err:",err)
		return
	}
}
```

测试聊天

## 5. 实现客户端和服务端之间的双向聊天

**修改客户端代码**

```java
package main
import (
	"bufio"
	"fmt"
	"net"
	"os"
)
/* TCP 客户端配置 */
func main() {
	for {
		conn, err := net.Dial("tcp", "127.0.0.1:20000")
		if err != nil {
			fmt.Println("连接服务端失败,err:", err)
			return
		}
		defer conn.Close()
		reader := bufio.NewReader(os.Stdin)
		input, err := reader.ReadString('\n')
		if err != nil {
			fmt.Println("获取信息失败,err:", err)
			return
		}
		_,err = conn.Write([]byte(input))
		if err != nil {
			fmt.Println("发送消息失败,err:",err)
			return
		}
	}
}
```

**测试**
