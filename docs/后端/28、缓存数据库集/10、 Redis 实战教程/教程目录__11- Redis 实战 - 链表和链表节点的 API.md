# 11- Redis 实战 - 链表和链表节点的 API
- 来源：https://ddkk.com/zhuanlan/db/redis-action/11.html
- 分类：缓存数据库
- 分组：教程目录
表3-1 列出了所有用于操作链表和链表节点的 API 。

表3-1 链表和链表节点 API

函数
作用
时间复杂度

listSetDupMethod
将给定的函数设置为链表的节点值复制函数。
 。

listGetDupMethod
返回链表当前正在使用的节点值复制函数。
复制函数可以通过链表的 dup 属性直接获得，

listSetFreeMethod
将给定的函数设置为链表的节点值释放函数。
 。

listGetFree
返回链表当前正在使用的节点值释放函数。
释放函数可以通过链表的 free 属性直接获得，

listSetMatchMethod
将给定的函数设置为链表的节点值对比函数。

listGetMatchMethod
返回链表当前正在使用的节点值对比函数。
对比函数可以通过链表的 match 属性直接获得，

listLength
返回链表的长度（包含了多少个节点）。
链表长度可以通过链表的 len 属性直接获得，  。

listFirst
返回链表的表头节点。
表头节点可以通过链表的 head 属性直接获得，  。

listLast
返回链表的表尾节点。
表尾节点可以通过链表的 tail 属性直接获得，  。

listPrevNode
返回给定节点的前置节点。
前置节点可以通过节点的 prev 属性直接获得，  。

listNextNode
返回给定节点的后置节点。
后置节点可以通过节点的 next 属性直接获得，  。

listNodeValue
返回给定节点目前正在保存的值。
节点值可以通过节点的 value 属性直接获得，  。

listCreate
创建一个不包含任何节点的新链表。

listAddNodeHead
将一个包含给定值的新节点添加到给定链表的表头。

listAddNodeTail
将一个包含给定值的新节点添加到给定链表的表尾。

listInsertNode
将一个包含给定值的新节点添加到给定节点的之前或者之后。

listSearchKey
查找并返回链表中包含给定值的节点。
 ， N 为链表长度。

listIndex
返回链表在给定索引上的节点。
 ， N 为链表长度。

listDelNode
从链表中删除给定节点。
 。

listRotate
将链表的表尾节点弹出，然后将被弹出的节点插入到链表的表头， 成为新的表头节点。

listDup
复制一个给定链表的副本。
 ， N 为链表长度。

listRelease
释放给定链表，以及链表中的所有节点。
 ， N 为链表长度。

|
