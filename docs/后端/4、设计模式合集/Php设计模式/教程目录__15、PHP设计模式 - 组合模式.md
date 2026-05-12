# 15、PHP设计模式 - 组合模式
- 来源：https://ddkk.com/zhuanlan/design/php/15.html
- 分类：设计模式
- 分组：教程目录
### 组合模式

组合模式，将对象组合成树形结构以表示“部分-整体”的层次结构，组合模式使得用户对单个对象和组合对象的使用具有一致性。掌握组合模式的重点是要理解清楚 “部分/整体” 还有 ”单个对象“ 与 “组合对象” 的含义。

### 模式结构

- Component ：组合中的对象声明接口，在适当的情况下，实现所有类共有接口的默认行为。声明一个接口用于访问和管理Component子部件。
- Leaf：叶子对象。叶子结点没有子结点。
- Composite：容器对象，定义有枝节点行为，用来存储子部件，在Component接口中实现与子部件有关操作，如增加(add)和删除(remove)等。

### 结构图

### PHP代码实现

```java
<?php
/**
 * 组合模式
 */
//组合中的对象声明接口
abstract class Component
{
    public function __construct($name)
    {
        $this->name=$name;
    }
    abstract public function Add(Component $c);
    abstract public function Remove(Component $c);
    abstract public function Display($depth);
}
//叶子对象
class Leaf extends Component
{
    public function Add(Component $c){
        var_dump('add');
    }
    public function Remove(Component $c){
        var_dump('Remove');
    }
    public function Display($depth){
        var_dump(str_repeat('-',$depth).$this->name);
    }
}
//容器对象
class Composite extends Component
{
    private $children=[];
    public function Add(Component $c){
        $this->children[]=$c;
    }
    public function Remove(Component $c){
        foreach ($this->children as $child){
            if ($child!= $c){
                $a[]=$child;
            }
        }
        $this->children=$a;
    }
    public function Display($depth){
        var_dump(str_repeat('-',$depth).$this->name);
        foreach ($this->children as $value){
            $value->Display($depth+2);
        }
    }
}
$root=new Composite('root');
$root->Add(new Leaf('Leaf A'));
$root->Add(new Leaf('Leaf B'));
$comp=new Composite('Composite X');
$comp->Add(new Leaf('Leaf XA'));
$comp->Add(new Leaf('Leaf XB'));
$root->Add($comp);
$comp2=new Composite('Composite XY');
$comp2->Add(new Leaf('Leaf XYA'));
$comp2->Add(new Leaf('Leaf XYB'));
$comp->Add($comp2);
$root->Add(new Leaf('Leaf C'));
$leaf=new Leaf('Leaf D');
$root->Add($leaf);
$root->Display(1);
```

### 运行结果

```java
string '-root' (length=5)
string '---Leaf A' (length=9)
string '---Leaf B' (length=9)
string '---Composite X' (length=14)
string '-----Leaf XA' (length=12)
string '-----Leaf XB' (length=12)
string '-----Composite XY' (length=17)
string '-------Leaf XYA' (length=15)
string '-------Leaf XYB' (length=15)
string '---Leaf C' (length=9)
string '---Leaf D' (length=9)
```
