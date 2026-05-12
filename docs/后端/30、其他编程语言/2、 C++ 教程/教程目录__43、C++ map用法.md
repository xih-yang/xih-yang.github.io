# 43、C++ map用法
- 来源：https://ddkk.com/zhuanlan/other/c/43.html
- 分类：C++ 教程
- 分组：教程目录
**1、map最基本的构造函数；**

map mapstring; map mapint;

map``mapstring; map``mapchar;

map mapchar; map mapint；

**2、map添加数据；**

```c
   map<int ,string> maplive;  
   1.maplive.insert(pair<int,string>(102,"aclive"));
   2.maplive.insert(map<int,string>::value_type(321,"hai"));
   3, maplive[112]="April";//map中最简单最常用的插入添加！
```

**3、map中元素的查找** ：

find()函数返回一个迭代器指向键值为key的元素，如果没找到就返回指向map尾部的迭代器。

```c
 map<int ,string >::iterator l_it;; 
   l_it=maplive.find(112);
   if(l_it==maplive.end())
                cout<<"we do not find 112"<<endl;
   else cout<<"wo find 112"<<endl;
```

**4、map中元素的删除** ：

如果删除112；

```c
 map<int ,string >::iterator l_it;;   
   l_it=maplive.find(112);
   if(l_it==maplive.end())
        cout<<"we do not find 112"<<endl;
   else  maplive.erase(l_it);  //delete 112;
```

**5、map中 swap的用法** ：

Map中的swap不是一个容器中的元素交换，而是两个容器交换；

示例：

```c
 #include <map> 
 #include <iostream>
  using namespace std;
  int main( )
  {
      map <int, int> m1, m2, m3;
      map <int, int>::iterator m1_Iter;
      m1.insert ( pair <int, int>  ( 1, 10 ) );
      m1.insert ( pair <int, int>  ( 2, 20 ) );
      m1.insert ( pair <int, int>  ( 3, 30 ) );
      m2.insert ( pair <int, int>  ( 10, 100 ) );
      m2.insert ( pair <int, int>  ( 20, 200 ) );
      m3.insert ( pair <int, int>  ( 30, 300 ) );
   cout << "The original map m1 is:";
   for ( m1_Iter = m1.begin( ); m1_Iter != m1.end( ); m1_Iter++ )
      cout << " " << m1_Iter->second;
      cout   << "." << endl;
   // This is the member function version of swap
   //m2 is said to be the argument map; m1 the target map
   m1.swap( m2 );
   cout << "After swapping with m2, map m1 is:";
   for ( m1_Iter = m1.begin( ); m1_Iter != m1.end( ); m1_Iter++ )
      cout << " " << m1_Iter -> second;
      cout  << "." << endl;
   cout << "After swapping with m2, map m2 is:";
   for ( m1_Iter = m2.begin( ); m1_Iter != m2.end( ); m1_Iter++ )
      cout << " " << m1_Iter -> second;
      cout  << "." << endl;
   // This is the specialized template version of swap
   swap( m1, m3 );
   cout << "After swapping with m3, map m1 is:";
   for ( m1_Iter = m1.begin( ); m1_Iter != m1.end( ); m1_Iter++ )
      cout << " " << m1_Iter -> second;
      cout   << "." << endl;
}
```

**6、map的sort问题** ：

Map中的元素是自动按key升序排序,所以不能对map用sort函数：

示例：

```c
 #include <map>  #include <iostream>
 using namespace std;
 int main( )
 {
   map <int, int> m1;
   map <int, int>::iterator m1_Iter;
   m1.insert ( pair <int, int>  ( 1, 20 ) );
   m1.insert ( pair <int, int>  ( 4, 40 ) );
   m1.insert ( pair <int, int>  ( 3, 60 ) );
   m1.insert ( pair <int, int>  ( 2, 50 ) );
   m1.insert ( pair <int, int>  ( 6, 40 ) );
   m1.insert ( pair <int, int>  ( 7, 30 ) );
   cout << "The original map m1 is:"<<endl;
   for ( m1_Iter = m1.begin( ); m1_Iter != m1.end( ); m1_Iter++ )
      cout <<  m1_Iter->first<<" "<<m1_Iter->second<<endl;
}
```

**7、map的基本操作函数** ：

C++Maps是一种关联式容器，包含“关键字/值”对

begin() 返回指向map头部的迭代器

clear(） 删除所有元素

begin() 返回指向map头部的迭代器

clear(） 删除所有元素

count() 返回指定元素出现的次数

empty() 如果map为空则返回true

end() 返回指向map末尾的迭代器

equal_range() 返回特殊条目的迭代器对

erase() 删除一个元素

find() 查找一个元素

get_allocator() 返回map的配置器

insert() 插入元素

key_comp() 返回比较元素key的函数

lower_bound() 返回键值>=给定元素的第一个位置

max_size() 返回可以容纳的最大元素个数

rbegin() 返回一个指向map尾部的逆向迭代器

rend() 返回一个指向map头部的逆向迭代器

size() 返回map中元素的个数

swap() 交换两个map

upper_bound() 返回键值>给定元素的第一个位置

value_comp() 返回比较元素value的函数
