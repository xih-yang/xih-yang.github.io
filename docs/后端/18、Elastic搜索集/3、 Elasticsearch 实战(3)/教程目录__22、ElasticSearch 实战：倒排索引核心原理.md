# 22、ElasticSearch 实战：倒排索引核心原理
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/3/22.html
- 分类：搜索引擎
- 分组：教程目录
我们看看下面2个doc是怎么建立倒排索引的

doc1：I really liked my small dogs, and I think my mom also liked them.

doc2：He never liked any dogs, so I hope that my mom will not expect me to liked him.

word
doc1
doc2

I
*
*

really
*

liked
*
*

my
*
*

small
*

dogs
*

and
*

think
*

mom
*
*

also
*

them
*

He

*

never

*

any

*

so

*

hope

*

that

*

will

*

not

*

expect

*

me

*

to

*

him

*

此时我们全文检索mother like little dog，是搜索不到结果的

那这是不是我们想要的？绝对不是。因为在我们看来monther和mom有区别吗？都是妈妈的意思，同义词。like和liked有区别吗？没有，都是喜欢的意思，只不过一个是现在时，一个是过去时。little和small有区别吗？都是小的，同义词。dog和dogs有区别吗？够，只不过一个单数一个复数。

所以如果是这样的建立索引和检索的话就是很失败的

> 因此，es其实在建立倒排索引的时候会进行一个操作(normalization)，也就是对拆分出来的各个单词进行相应的处理（时态的转换，单复数的转换，同义词的转换，大小写的转换），以提升后面搜索的时候能够搜索到相关联的文档的概率

针对上面2个doc，建立索引时会进行下面的转换

```java
liked —> like
small —> little
dogs —> dog
```

加入normalization操作后，真实的倒排索引是这样的

word
doc1
doc2
normalization

I
*
*

really
*

like
*
*
liked --> like

my
*
*

little
*

small --> little

dog
*
*
dogs --> dog

and
*

think
*

mom
*
*

also
*

them
*

He

*

never

*

any

*

so

*

hope

*

that

*

will

*

not

*

expect

*

me

*

to

*

him

*

接下来我们进行全文检索mother like little dog，会先进行分词和normalization操作

```java
mother	--> mom
like	--> like
little	--> little
dog	--> dog
```

此时doc1和doc2都会搜索出来了
