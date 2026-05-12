# 7- Redis 实战 - SDS API
- 来源：https://ddkk.com/zhuanlan/db/redis-action/7.html
- 分类：缓存数据库
- 分组：教程目录
表2-2 列出了 SDS 的主要操作 API 。

表2-2 SDS 的主要操作 API

函数
作用
时间复杂度

sdsnew
创建一个包含给定 C 字符串的 SDS 。
 ， N 为给定 C 字符串的长度。

sdsempty
创建一个不包含任何内容的空 SDS 。

sdsfree
释放给定的 SDS 。

sdslen
返回 SDS 的已使用空间字节数。
这个值可以通过读取 SDS 的 len 属性来直接获得， 复杂度为  。

sdsavail
返回 SDS 的未使用空间字节数。
这个值可以通过读取 SDS 的 free 属性来直接获得， 复杂度为  。

sdsdup
创建一个给定 SDS 的副本（copy）。
 ， N 为给定 SDS 的长度。

sdsclear
清空 SDS 保存的字符串内容。
因为惰性空间释放策略，复杂度为  。

sdscat
将给定 C 字符串拼接到 SDS 字符串的末尾。
 ， N 为被拼接 C 字符串的长度。

sdscatsds
将给定 SDS 字符串拼接到另一个 SDS 字符串的末尾。
 ， N 为被拼接 SDS 字符串的长度。

sdscpy
将给定的 C 字符串复制到 SDS 里面， 覆盖 SDS 原有的字符串。
 ， N 为被复制 C 字符串的长度。

sdsgrowzero
用空字符将 SDS 扩展至给定长度。
 ， N 为扩展新增的字节数。

sdsrange
保留 SDS 给定区间内的数据， 不在区间内的数据会被覆盖或清除。
 ， N 为被保留数据的字节数。

sdstrim
接受一个 SDS 和一个 C 字符串作为参数， 从 SDS 左右两端分别移除所有在 C 字符串中出现过的字符。
 ， M 为 SDS 的长度， N 为给定 C 字符串的长度。

sdscmp
对比两个 SDS 字符串是否相同。
 ， N 为两个 SDS 中较短的那个 SDS 的长度。
