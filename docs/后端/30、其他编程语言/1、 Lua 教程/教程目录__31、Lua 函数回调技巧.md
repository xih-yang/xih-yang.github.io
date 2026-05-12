# 31、Lua 函数回调技巧
- 来源：https://ddkk.com/zhuanlan/other/lua/31.html
- 分类：Lua 教程
- 分组：教程目录
## 技巧1：

```sh
local a = {};function b()    print("Hello World")enda["sell"] = {callFunc =b}a["sell"].callFunc()
```

## #

## 技巧2：

使用lua 自带的 unpack :

解释：把一直数组（只有连续数字下标的 table）展开成一串返回值，但是对用字符串或别的东西做 key 的 table 无能为力。

```sh
function unpackex(tbl, args)    local ret = {}    for _,v in ipairs(args) do        table.insert(ret, tbl[v])    end    return unpack(ret)endprint(unpackex({one = {"one", "two", "three"}, two = "T" , three = "TH"},{"one", "two", "three"}))
```

输出：>> table: 00ABC2D0TTH
