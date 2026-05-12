# 17、Netty 基础 之 Unpooled类
- 来源：https://ddkk.com/zhuanlan/server/netty/4/17.html
- 分类：服务器框架
- 分组：教程目录
## 一、Unpooled类介绍

**1、** netty提供一个专门用来操作缓冲区（即netty的数据容器）的工具类；

**2、** 常用方法；

public static ByteBuf copiedBuffer(CharSequence string, Charset charset)

通过给定的数据和字符编码返回一个ByteBuf对象（类似于NIO中的ByteBuffer但有区别）。

**3、** 例子；

Unpooled类获取netty的数据容器ByteBuf的基本使用。

NettyByteBuf01.java

```java
package netty.buf;
import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
public class NettyByteBuf01 {
	public static void main(String[] args) {
		//创建一个ByteBuf
		//说明
		//1. 创建一个对象，该对象包含一个数组arr，是一个byte[10]
		//2. 在netty的buffer中，不需要使用flip进行反转
		//   是因为底层维护了readerIndex属性和writerIndex属性
		//3. 通过 readerIndex 和 writerIndex 和 capacity，将buffer分成了三段
		//   0 --> readerIndex：已经读取的区域
		//   readerIndex --> writerIndex：可读的区域
		//   writerIndex --> capacity：可写的区域
		ByteBuf buffer = Unpooled.buffer(10);
		for (int i = 0; i < 10; i++) {
			buffer.writeByte(i);
		}
		System.out.println("capacity=" + buffer.capacity()); //10
		//输出
		for (int i = 0; i < buffer.capacity(); i++) {
			System.out.println(buffer.readByte());
		}
	}
}
```

**4、** readerIndex属性和writerIndex属性；

不指定索引，用readByte()方法读，readerIndex会增加。

写的时候writerIndex先加，readerIndex在后面追赶，只能读到writerIndex的位置。

```java
 * <h3>Sequential Access Indexing</h3>
 *
 * {@link ByteBuf} provides two pointer variables to support sequential
 * read and write operations - {@linkreaderIndex() readerIndex} for a read
 * operation and {@linkwriterIndex() writerIndex} for a write operation
 * respectively.  The following diagram shows how a buffer is segmented into
 * three areas by the two pointers:
 *
 * <pre>
 *      +-------------------+------------------+------------------+
 *      | discardable bytes |  readable bytes  |  writable bytes  |
 *      |                   |     (CONTENT)    |                  |
 *      +-------------------+------------------+------------------+
 *      |                   |                  |                  |
 *      0      <=      readerIndex   <=   writerIndex    <=    capacity
 * </pre>
```

**5、** 例子2；

NettyByteBuf02.java

```java
package netty.buf;
import java.nio.charset.Charset;
import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
public class NettyByteBuf02 {
	public static void main(String[] args) {
		//创建ByteBuf
		ByteBuf byteBuf = Unpooled.copiedBuffer("hello, world!", Charset.forName("utf-8"));
		//使用相关的API
		if (byteBuf.hasArray()) {
			byte[] content = byteBuf.array();
			//将content转成字符串
			//trim()去掉结尾的0
			System.out.println(new String(content, Charset.forName("utf-8")).trim());
			System.out.println("byteBuf=" + byteBuf);
			System.out.println(byteBuf.arrayOffset()); //数组偏移量
			System.out.println(byteBuf.readerIndex());
			System.out.println(byteBuf.writerIndex());
			System.out.println(byteBuf.capacity());
			int len = byteBuf.readableBytes();
			System.out.println("len=" + len);
			//使用for取出各个字节
			for (int i = 0; i < len; i++) {
				System.out.println((char)byteBuf.getByte(i));
			}
			//从某个位置读取多少个长度
			System.out.println(byteBuf.getCharSequence(0, 4, Charset.forName("utf-8")));
			System.out.println(byteBuf.getCharSequence(4, 6, Charset.forName("utf-8")));
		}
	}
}
```
