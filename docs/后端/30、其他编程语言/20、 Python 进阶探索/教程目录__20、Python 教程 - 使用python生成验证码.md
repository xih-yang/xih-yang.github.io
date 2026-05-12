# 20、Python 教程 - 使用python生成验证码
- 来源：https://ddkk.com/zhuanlan/other/python/3/20.html
- 分类：Python 进阶探索
- 分组：教程目录
快速生成验证码(内推码/密码 nums+alpha)：

```java
import random
import string
code_str = string.ascii_letters + string.digits
def gen_code(len=4):
    return ''.join(random.sample(code_str,len))
print([gen_code(10) for i in range(10)])
```

输出结果：

```java
['bErxkIlXOm', 'gPypzIOrnc', 'JmiUkyWopS', '3EHBmteSKw', '7J4AEyUO9R', 'eLMnjiZozE', 'NySvpYBlHE', 'FLDlW2anMH', 'yapgecnzLV', 'Q5Iz1CihtS']
```
