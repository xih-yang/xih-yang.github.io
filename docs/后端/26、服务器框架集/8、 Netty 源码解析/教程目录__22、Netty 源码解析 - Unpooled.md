# 22、Netty 源码解析 - Unpooled
- 来源：https://ddkk.com/zhuanlan/server/netty/1/22.html
- 分类：服务器框架
- 分组：教程目录
## 一、基本介绍

1、Netty 提供一个专门用来操作缓冲区（即Netty的数据容器）的工具类

2、常用方法：

- public static ByteBuf copiedBuffer(CharSequence string, Charset charset)：通过给定的数据和字符编码返回一个ByteBuf对象（类似于NIO中的ByteBuffer，但有区别）

3、Unpooled 获取Netty的数据容器ByteBuf

```java
public class NettyByteBuf01 {
    public static void main(String[] args) {
        // 创建一个ByteBuf
        // 说明：
        // 1. 创建对象，该对象包含一个数组 arr，是一个byte[10]
        // 2. 在 netty 的 buffer 中，不需要使用 flip 进行反转
        //      底层维护了 readerIndex 和 writerIndex
        // 3、通过 readerIndex、writerIndex 和 capacity，将buffer分成三个区域
        // 0-----readerIndex：已经读取的区域
        // readerIndex----writerIndex：可读的区域
        // writerIndex----capacity：可写的区域    
        ByteBuf buffer = Unpooled.buffer(10);
        for(int i=0; i < 10; i++){
            buffer.writeByte(i);
        }
        System.out.println("capacity=" + buffer.capacity());
        // 输出
        for(int i=0; i < buffer.capacity(); i++){
            System.out.println(buffer.getByte(i));
        }
        for(int i=0; i < buffer.capacity(); i++){
            System.out.println(buffer.readByte());
        }
        System.out.println("执行完毕");
    }
}
```

```java
public class NettyByteBuf02 {
    public static void main(String[] args) {
        // 创建ByteBuf
        ByteBuf byteBuf = Unpooled.copiedBuffer("Hello,World!", CharsetUtil.UTF_8);
        // 使用相关的方法
        if(byteBuf.hasArray()){ // true
            byte[] content = byteBuf.array();
            // 将 content 转成字符串
            System.out.println(new String(content,CharsetUtil.UTF_8));
            System.out.println("byteBuf = " + byteBuf);
            System.out.println(byteBuf.arrayOffset()); // 0
            System.out.println(byteBuf.readerIndex()); // 0
            System.out.println(byteBuf.writerIndex()); // 12
            System.out.println(byteBuf.capacity());
            System.out.println(byteBuf.readByte()); // 减少一个
            int len = byteBuf.readableBytes(); // 可读的字节数 11
            System.out.println("len="+len);
            // 使用for取出各个字节
            for(int i =0;i < len; i++){
                System.out.println((char) byteBuf.getByte(i));
            }
            // 按照某个范围读取
            System.out.println(byteBuf.getCharSequence(0,4,CharsetUtil.UTF_8));
            System.out.println(byteBuf.getCharSequence(4,6,CharsetUtil.UTF_8));
        }
    }
}
```
