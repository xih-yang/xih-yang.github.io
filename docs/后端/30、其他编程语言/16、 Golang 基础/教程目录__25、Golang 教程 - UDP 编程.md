# 25、Golang 教程 - UDP 编程
- 来源：https://ddkk.com/zhuanlan/other/golang/2/25.html
- 分类：其他语言
- 分组：教程目录
UDP是用户数据报协议，是一种无连接传输协议，不需要建立连接就可以直接发送和接收数据，属于不可靠的，没有时序的通信，UDP 实时性好，适合直播环境。

## 1. 服务端配置

`示例`

```java
package main
import (
    "fmt"
    "net"
)
/* UDP 服务端 */
func main() {
    // 1. 监听
    listener,err := net.ListenUDP("udp",&net.UDPAddr {
        IP:		net.ParseIP("127.0.0.1"),
        Port:	30000,
    })
    if err != nil {
        fmt.Println("启动 server 失败,err:",err)
        return
    }
    // 退出时关闭资源
    defer listener.Close()
    // 循环收发数据
    for {
        var buf [1024]byte
        // 因为是无连接，所以需要知道对方地址 Addr
        n,addr,err := listener.ReadFromUDP(buf[:])
        if err != nil {
            fmt.Println("接收消息失败,err:",err)
            return
        }
        fmt.Printf("接收到来自 %v 的消息:%v\n",addr,string(buf[:n]))
        // 回复消息
        n,err = listener.WriteToUDP([]byte("hi"),addr)
        if err != nil {
            fmt.Println("回复失败,err:",err)
            return
        }
    }
}
```

## 2. 客户端配置

`示例`

```java
package main
import (
	"fmt"
	"net"
)
/* UDP 客户端 */
func main() {
	// 连接 UDP 服务器
	conn,err := net.Dial("udp","127.0.0.1:30000")
	if err != nil {
		fmt.Println("连接失败,err:",err)
		return
	}
	defer conn.Close()
	// 发送消息
	n,err := conn.Write([]byte("hello"))
	if err != nil {
		fmt.Println("发送失败,err:",err)
		return
	}
	// 接收消息
	var buf [1024]byte
	n,err = conn.Read(buf[:])	// n 为返回的有效字节个数
	if err != nil {
		fmt.Println("接收消息失败,err:",err)
		return
	}
	fmt.Println("收到回复:",string(buf[:n]))
}
```

`实现效果`

## 3. 实现双向聊天

`修改客户端`

```java
package main
import (
	"bufio"
	"fmt"
	"net"
	"os"
)
/* UDP 客户端 */
func main() {
	for {
		// 连接 UDP 服务器
		conn, err := net.Dial("udp", "127.0.0.1:30000")
		if err != nil {
			fmt.Println("连接失败,err:", err)
			return
		}
		defer conn.Close()
		defer conn.Close()
		reader := bufio.NewReader(os.Stdin)
		input, err := reader.ReadString('\n')
		if err != nil {
			fmt.Println("获取信息失败,err:", err)
			return
		}
		_, err = conn.Write([]byte(input))
		if err != nil {
			fmt.Println("发送消息失败,err:", err)
			return
		}
	}
}
```

`实现效果`

## 4. 优化多客户端实现通讯

`修改服务端`

```java
package main
import (
	"fmt"
	"net"
)
/* UDP 服务端 */
func process(listener net.UDPConn) {
	defer listener.Close()
	// 循环收发数据
	for {
		var buf [1024]byte
		// 因为是无连接，所以需要知道对方地址 Addr
		n, addr, err := listener.ReadFromUDP(buf[:])
		if err != nil {
			fmt.Println("接收消息失败,err:", err)
			return
		}
		fmt.Printf("接收到来自 %v 的消息:%v\n", addr, string(buf[:n]))
		// 回复消息
		n, err = listener.WriteToUDP([]byte("hi"), addr)
		if err != nil {
			fmt.Println("回复失败,err:", err)
			return
		}
	}
}
func main() {
	// 1. 监听
	listener,err := net.ListenUDP("udp",&net.UDPAddr {
		IP:		net.ParseIP("127.0.0.1"),
		Port:	30000,
	})
	if err != nil {
		fmt.Println("启动 server 失败,err:",err)
		return
	}
	process(*listener)
}
```

`开两个客户端看看效果`

/images/

**PS：可以将服务端和客户端打成 exe 文件，发给不同的人，修改 IP，实现群聊效果。go 语言不同于 java，python …，golang 可以直接打成 exe 文件，不需要依赖环境直接运行，但同时也有安全性问题。**

/images/
