# 06、Netty 源码解析 - Buffer类型化和只读
- 来源：https://ddkk.com/zhuanlan/server/netty/1/6.html
- 分类：服务器框架
- 分组：教程目录
## 一、注意事项

1、ByteBuffer 支持类型化的 put 和 get，put 放入的是什么数据类型，get 就应该使用相应的数据类型来取出，否则可能有 BufferUnderflowException 异常

```java
public class NIOByteBufferPutGet {
    public static void main(String[] args) {
        // 创建一个 Buffer
        ByteBuffer buffer = ByteBuffer.allocate(64);
        // 类型化方式放入数据
        buffer.putInt(100);
        buffer.putLong(9L);
        buffer.putChar('我');
        buffer.putShort((short) 4);
        // 读取数据
        buffer.flip();
        System.out.println(buffer.getInt());
        System.out.println(buffer.getLong());
        System.out.println(buffer.getChar());
        System.out.println(buffer.getShort());
    }
}
```

2、可以将一个普通 Buffer 转成只读 Buffer，如果向只读 Buffer 中，存放数据，会抛出 ReadOnlyBufferException 异常

```java
public class ReadOnlyBuffer {
    public static void main(String[] args) {
        // 创建一个 Buffer
        ByteBuffer buffer = ByteBuffer.allocate(64);
        System.out.println(buffer.getClass()); // java.nio.HeapByteBuffer
        for(int i=0; i < buffer.capacity(); i++){
            buffer.put((byte)i);
        }
        // 读取
        buffer.flip();
        // 得到一个只读的 Buffer
        ByteBuffer readOnlyBuffer = buffer.asReadOnlyBuffer();
        System.out.println(readOnlyBuffer.getClass()); // java.nio.HeapByteBufferR
        while (readOnlyBuffer.hasRemaining()){
            System.out.println(readOnlyBuffer.get());
        }
        //readOnlyBuffer.put((byte)64); // 抛出异常 ReadOnlyBufferException
    }
}
```

3、NIO 还提供了 MappedByteBuffer，可以让文件直接在内存（堆外的内存）中进行修改，而如何同步到文件由 NIO 来完成

```java
/*
说明
1. MappedByteBuffer 可以让文件直接在内存（堆外内存）修改，操作系统不需要拷贝一次
 */
public class MappedByteBufferTest {
    public static void main(String[] args) throws IOException {
        RandomAccessFile randomAccessFile = new RandomAccessFile("1.txt", "rw");
        // 获取对应的通道
        FileChannel channel = randomAccessFile.getChannel();
        /**
         * 参数1： FileChannel.MapMode.READ_WRITE 使用的是读写模式
         * 参数2： 0 可以直接修改的起始位置
         * 参数3： 5 映射到内存的大小（不是索引位置），即将 1.txt 的多少个字节映射到内存
         * 可以直接修改的范围就是 0-5
         * 实际类型是 java.nio.DirectByteBuffer
         */
        MappedByteBuffer mappedByteBuffer = channel.map(FileChannel.MapMode.READ_WRITE, 0, 5);
        mappedByteBuffer.put(0,(byte)'W');
        mappedByteBuffer.put(3,(byte)'9');
        //mappedByteBuffer.put(5,(byte)'Y'); // java.lang.IndexOutOfBoundsException
        randomAccessFile.close();
        System.out.println("修改成功");
    }
}
```

4、NIO 不仅支持通过一个 Buffer 来完成读写操作，还支持 通过多个 Buffer （即Buffer数组）完成读写操作，即 Scattering（分散） 和 Gathering（聚集）

```java
/**
 * Scattering：将数据写入到 buffer 时，可以采用 buffer 数组，依次写入 [分散]
 * Gathering：从 buffer 读取数据时，可以采用 buffer 数组，依次读取 [聚集]
 */
public class ScatteringAndGatheringTest {
    public static void main(String[] args) throws IOException {
        // 使用 ServerSocketChannel 和 SocketChannel 网络
        ServerSocketChannel serverSocketChannel = ServerSocketChannel.open();
        InetSocketAddress inetSocketAddress = new InetSocketAddress(7000);
        // 绑定端口到 socket，并启动
        serverSocketChannel.socket().bind(inetSocketAddress);
        // 创建 buffer 数组
        ByteBuffer[] byteBuffers = new ByteBuffer[2];
        byteBuffers[0] = ByteBuffer.allocate(5);
        byteBuffers[1] = ByteBuffer.allocate(3);
        // 等待客户端连接（telnet）
        SocketChannel socketChannel = serverSocketChannel.accept();
        // 假定从客户端接收8个字节
        int messageLength = 5 + 3;
        // 循环读取
        while (true) {
            long byteRead = 0;
            while (byteRead < messageLength) {
                long read = socketChannel.read(byteBuffers);
                byteRead += read; // 累计读取的字节数
                System.out.println("byteRead = " + byteRead);
                // 使用流打印，查看当前这个 buffer 的 position 和 limit
                Arrays.asList(byteBuffers).
                        stream().
                        map(buffer -> "position = " + buffer.position() + ",limit = " + buffer.limit()).
                        forEach(System.out::println);
            }
            // 将所有的buffer进行flip
            Arrays.asList(byteBuffers).forEach(buffer -> buffer.flip());
            // 将数据读出显示到客户端
            long byteWirte = 0;
            while (byteWirte < messageLength){
                long write = socketChannel.write(byteBuffers);
                byteWirte += write;
            }
            // 将所有的 buffer 进行 clear
            Arrays.asList(byteBuffers).forEach(buffer -> {
                buffer.clear();
            });
            System.out.println("byteRead="+byteRead+" byteWirte="+byteWirte+" messageLength="+messageLength);
        }
    }
}
```
