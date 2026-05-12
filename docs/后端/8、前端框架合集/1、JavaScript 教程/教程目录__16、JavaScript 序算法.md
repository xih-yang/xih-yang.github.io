# 16、JavaScript 序算法
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/16.html
- 分类：前端框架
- 分组：教程目录
冒泡排序:

规则：前后两个数两两进行比较，如果符合交换条件两个数交换位置

规律：冒泡排序的每一轮排序，都可以找出一个较大的数放在正确的位置。

比较轮数=数组长度-1

每一轮比较的次数=数组长度-当前的轮数

654 3 2 1

第一轮：比较五次 6要跟5个数比较，也就是比较五次

564 3 2 1

546 3 2 1

543 6 2 1

543 2 6 1

543 2 1 **6**

第二轮：比较四次

453 2 1

435 2 1

432 5 1

432 1 **5**

第三轮：比较三次

342 1

324 1

321 **4**

第四轮：比较两次

231

21**3**

第五轮：比较一次

1**2**

```java
var arr=[6,5,4,3,2,1]
for(var j=0;j<arr.length-1;j++){
for(var i=0;i<arr.length-j-1;i++){
    if(arr[i]>arr[i+1]){
        swap=arr[i+1];
        arr[i+1]=arr[i];
        arr[i]=swap
    }
}
}
```

时间复杂度：O(n^2)

选择排序：打擂台法

规则：选出一个位置，这个位置上的元素，和后面所有数字进行比较，如果比较出大小就交换两个数位置

规律：每一轮都能选出一个最小的数，放在正确的位置

比较轮数：数组长度-1

每轮比较次数：数组长度-当前轮数

从小到大

```java
var arr=[6,5,4,3,2,1]
function selection_sort(arr){
    var swap=null
    for(var i=0;i<arr.length-1;i++){
        var min=i
        for(var j=i+1;j<arr.length;j++){
            if(arr[j]<arr[min]){
                min=j
            }
        }
        swap=arr[min]
        arr[min]=arr[i];
        arr[i]=swap;
    }
}
selection_sort(arr)
console.log(arr)
```
