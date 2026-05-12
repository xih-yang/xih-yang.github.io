# 07、Netty 源码分析 - Netty 字节缓冲区 ByteBuf（下）
- 来源：https://ddkk.com/zhuanlan/server/netty/3/7.html
- 分类：服务器框架
- 分组：教程目录
在了解了 ByteBuffer 的原理之后，再来理解 Netty 的 ByteBuf 就比较简单了。

ByteBuf 是 Netty 框架封装的数据缓冲区，区别于 `position`、`limit`、`flip`等属性和操作来控制 `ByteBuffer`的读写，`ByteBuf`通过两个位置指针来协助缓冲区的读写操作，分别是`readIndex`和`writeIndex`。

`readIndex`、`writeIndex`和`capacity`变量存在以下关系：

```java
0 <= readIndex <= writeIndex <= capacity
```

## 实现原理

初始化`ByteBuffer` 时，`readIndex` 和 `writeIndex` 取值一开始都是0。如下图所示：

当执行写入数据之后，`writeIndex`会增加，如下图所示：

当执行读入数据之后则会使`readIndex`增加，但不会超过`writeIndex`，如下图：

在读取之后，索引 0 到 `readIndex`位置的区域被视为废弃字节（discard）。可以调用`discardReadBytes`方法，来释放这部分空间，其作用类似于 `ByteBuffer`的`compact()`方法，移除无用的数据，实现缓冲区的重复利用。如下图，展示了执行`discardReadBytes`后的情况，相当于可写的空间变大了。

## ByteBuf 的使用案例

为了更好的理解`ByteBuf`，编写了以下示例：

```java
public class ByteBufDemo {
	/**
	 * @param args
	 */
	public static void main(String[] args) {
		// 创建一个缓冲区
		ByteBuf buffer = Unpooled.buffer(10);
		System.out.println("------------初始时缓冲区------------");
		printBuffer(buffer);
		// 添加一些数据到缓冲区中
		System.out.println("------------添加数据到缓冲区------------");
		String s = "love";
		buffer.writeBytes(s.getBytes());
		printBuffer(buffer);
		// 读取数据
		System.out.println("------------读取数据------------");
		while (buffer.isReadable()) {
			System.out.println(buffer.readByte());
		}
		printBuffer(buffer);
		// 执行compact
		System.out.println("------------执行discardReadBytes------------");
		buffer.discardReadBytes();
		printBuffer(buffer);
		// 执行clear
		System.out.println("------------执行clear清空缓冲区------------");
		buffer.clear();
		printBuffer(buffer);
	}
	/**
	 * 打印出ByteBuf的信息
	 * 
	 * @param buffer
	 */
	private static void printBuffer(ByteBuf buffer) {
		System.out.println("readerIndex：" + buffer.readerIndex());
		System.out.println("writerIndex：" + buffer.writerIndex());
		System.out.println("capacity：" + buffer.capacity());
	}
}
```

输出结果：

```java
------------初始时缓冲区------------
readerIndex：0
writerIndex：0
capacity：10
------------添加数据到缓冲区------------
readerIndex：0
writerIndex：4
capacity：10
------------读取数据------------
108
111
118
101
readerIndex：4
writerIndex：4
capacity：10
------------执行discardReadBytes------------
readerIndex：0
writerIndex：0
capacity：10
------------执行clear清空缓冲区------------
readerIndex：0
writerIndex：0
capacity：10
Process finished with exit code 0
```

对比`ByteBuffer`和`ByteBuf`两个示例可以看出，Netty 提供了更加方便地创建`ByteBuf`的工具（`unpooled`），同时，也不必再执行`flip()`方法来切换读写模式。对比而言，`ByteBuf`更加易于使用。

## ByteBuf 的3种使用模式

`ByteBuf` 共有三种使用模式：堆缓冲区模式（Heap Buffer）、直接缓冲区模式（Direct Buffer）和 复合缓冲区模式（Composite Buffer）。

### 堆缓冲模式

> 堆缓冲区模式又称为支撑数组，其数据是存放在JVM的堆空间，通过将数据存储在数组中实现。

`优点`：数据存储在`JVM`堆中可以快速的创建和快速释放，并且提供了数据快速访问的方法；

`缺点`：每次数据与 I/O 进行传输时，都需要将数据复制到直接缓冲区。

以下是堆缓冲区的代码示例：

```java
public class ByteBufHeapBufferDemo {
	/**
	 * @param args
	 */
	public static void main(String[] args) {
		// 创建一个堆缓冲区
		ByteBuf buffer = Unpooled.buffer(10);
		String s = "waylau";
		buffer.writeBytes(s.getBytes());
		// 检查是否是支撑数组
		if (buffer.hasArray()) {
			// 获取支撑数组的引用
			byte[] array = buffer.array();
			// 计算第一个字节的偏移量
			int offset = buffer.readerIndex() + buffer.arrayOffset();
			// 可读字节数
			int length = buffer.readableBytes();
			printBuffer(array, offset, length);
		}
	}
	/**
	 * 打印出Buffer的信息
	 * 
	 * @param buffer
	 */
	private static void printBuffer(byte[] array, int offset, int len) {
		System.out.println("array：" + array);
		System.out.println("array->String：" + new String(array));
		System.out.println("offset：" + offset);
		System.out.println("len：" + len);
	}
}
```

输出结果：

```java
array：[B@5b37e0d2
array->String：waylau    
offset：0
len：6
Process finished with exit code 0
```

### 直接缓冲区模式

> 直接缓冲区属于堆外分配的直接内存，不会占用堆得空间。

`优点`：使用 socket 传输数据时性能很好，避免了数据从 JVM 堆内存复制到直接缓冲区的过程，提高了性能。

`缺点`：相对于堆缓冲区而言，直接缓冲区分配内存空间和释放更为昂贵。

对于涉及大量的 I/O 数据的读写，建议使用直接缓冲区。而对于用于后端业务消息编解码模块，建议使用堆缓冲区。

以下是直接缓冲区代码示例：

```java
public class ByteBufDirectBufferDemo {
	/**
	 * @param args
	 */
	public static void main(String[] args) {
		// 创建一个直接缓冲区
		ByteBuf buffer = Unpooled.directBuffer(10);
		String s = "waylau";
		buffer.writeBytes(s.getBytes());
		// 检查是否是支撑数组.
		// 不是支撑数组，则为直接缓冲区
		if (!buffer.hasArray()) {
			// 计算第一个字节的偏移量
			int offset = buffer.readerIndex();
			// 可读字节数
			int length = buffer.readableBytes();
			// 获取字节内容
			byte[] array = new byte[length];
			buffer.getBytes(offset, array);
			printBuffer(array, offset, length);
		}
	}
	/**
	 * 打印出Buffer的信息
	 * 
	 * @param buffer
	 */
	private static void printBuffer(byte[] array, int offset, int len) {
		System.out.println("array：" + array);
		System.out.println("array->String：" + new String(array));
		System.out.println("offset：" + offset);
		System.out.println("len：" + len);
	}
}
```

输出结果：

```java
array：[B@6d5380c2
array->String：waylau
offset：0
len：6
Process finished with exit code 0
```

### 复合缓冲区模式

> 复合缓冲区是 Netty 特有的缓冲区。本质上类似于提供一个或多个 ByteBuf 的组合视图，可以根据需要添加和删除不同类型的 ByteBuf。

`优点`：提供了一种访问方式让使用者自由地组合多个`ByteBuf`，避免了复制和分配新的缓冲区。

`缺点`：不支持访问其支撑数组。因此如果要访问，需要先将内容复制到堆内存中，再进行访问。

以下示例是复合缓冲区将堆缓冲区和直接缓冲区组合在一起，没有进行任何复制过程，仅仅创建了一个视图而已。

```java
public class ByteBufCompositeBufferDemo {
	/**
	 * @param args
	 */
	public static void main(String[] args) {
		// 创建一个堆缓冲区
		ByteBuf heapBuf = Unpooled.buffer(3);
		String way = "way";
		heapBuf.writeBytes(way.getBytes());
		// 创建一个直接缓冲区
		ByteBuf directBuf = Unpooled.directBuffer(3);
		String lau = "lau";
		directBuf.writeBytes(lau.getBytes());
		// 创建一个复合缓冲区
		CompositeByteBuf compositeBuffer = Unpooled.compositeBuffer(10);
		compositeBuffer.addComponents(heapBuf, directBuf); // 将缓冲区添加到符合缓冲区
		// 检查是否是支撑数组.
		// 不是支撑数组，则为复合缓冲区
		if (!compositeBuffer.hasArray()) {
			for (ByteBuf buffer : compositeBuffer) {
				// 计算第一个字节的偏移量
				int offset = buffer.readerIndex();
				// 可读字节数
				int length = buffer.readableBytes();
				// 获取字节内容
				byte[] array = new byte[length];
				buffer.getBytes(offset, array);
				printBuffer(array, offset, length);
			}
		}
	}
	/**
	 * 打印出Buffer的信息
	 * 
	 * @param buffer
	 */
	private static void printBuffer(byte[] array, int offset, int len) {
		System.out.println("array：" + array);
		System.out.println("array->String：" + new String(array));
		System.out.println("offset：" + offset);
		System.out.println("len：" + len);
	}
}
```

输出结果：

```java
array：[B@4d76f3f8
array->String：way
offset：0
len：3
array：[B@2d8e6db6
array->String：lau
offset：0
len：3
Process finished with exit code 0
```

`CompositeByteBuf`是一个虚拟的缓冲区，其用途是将多个缓冲区显示为单个合并缓冲区，类似数据库中的视图。

## 总结

通过以上对于`ByteBuf`的介绍，相信小伙伴们对于`ByteBuf`的原理也有了一定的了解。下一节我们继续深入Netty的源码。
