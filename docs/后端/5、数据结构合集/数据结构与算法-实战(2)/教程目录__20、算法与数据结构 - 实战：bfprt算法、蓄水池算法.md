# 20、算法与数据结构 - 实战：bfprt算法、蓄水池算法
- 来源：https://ddkk.com/zhuanlan/algorithm/6/20.html
- 分类：数据结构
- 分组：教程目录
## 给定一个整形数组，返回其中第K小的数

这一题的最优解就是改写快速排序

取一个基准数v，对数组做partition，大于v的放右边，小于k的放左边，等于v的放中间

然后看等于区域是否包含k这个位置

如果k这个位置在等于区域中间，那么返回v

否则看k在等于区域左边，还是在右边，在左边就对左边部分进行partition，在右边就对右边部分做partition，如此一直到等于区域包含k这个位置

时间复杂度为O(n)，因为不需要像真正快排那样两边都做partition，只要对一边做partition，而且等于区域包含k就返回

```java
/**
 * 给定一个整形数组，返回其中第K小的数
 * Created by huangjunyi on 2022/9/6.
 */
public class Bfprt01 {
    /**
     * 递归版本
     */
    public static int getMinKth01(int[] arr, int k) {
        // 找第K小的数，就是找数组中排序后下标诶k-1的数
        return process(arr, 0, arr.length - 1, k - 1);
    }
    private static int process(int[] arr, int l, int r, int i) {
        // base case
        if (l == r) return arr[l];
        // 对数组指定区域做partition，返回等于区域的左右边界
        int[] range = partition(arr, l, r);
        // 如果目标位置i在等于区域内部，则返回arr[i]，就是第K小的数
        if (i >= range[0] && i <= range[1]) return arr[i];
            // 目标位置在等于区域左边，对左边做partition
        else if (i <range[0]) return process(arr, l, range[0] - 1, i);
            // 目标位置在等于区域右边，对右边做partition
        else return process(arr, range[1] + 1, r, i);
    }
    /**
     * 迭代版本
     */
    public static int getMinKth02(int[] arr, int k) {
        int l = 0;
        int r = arr.length - 1;
        int i = k - 1;
        while (l < r) {
            // 对数组指定区域做partition，返回等于区域的左右边界
            int[] range = partition(arr, l, r);
            // 如果目标位置i在等于区域内部，则返回arr[i]，就是第K小的数
            if (i >= range[0] && i <= range[1]) return arr[i];
                // 目标位置在等于区域左边，对左边做partition
            else if (i <range[0]) r = range[0] - 1;
                // 目标位置在等于区域右边，对右边做partition
            else l = range[1] + 1;
        }
        return arr[l];
    }
    private static int[] partition(int[] arr, int l, int r) {
        if (l > r) return new int[]{
     -1, -1};
        if (l == r) return new int[]{
     l, r};
        int low = l - 1;
        int high = r;
        int i = l;
        while (i < high) {
            if (arr[i] < arr[r]) swap(arr, i++, ++low);
            else if (arr[i] > arr[r]) swap(arr, i, --high);
            else i++;
        }
        swap(arr, high, r);
        return new int[]{
     low + 1, high};
    }
    private static void swap(int[] arr, int i, int j) {
        int temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
}
```

## 给定一个整形数组，返回其中第K小的数，bfprt算法求解

### bfprt与改写快排的区别

改写快排的方式是：

**1、** 随机选一个数p，；

**2、** 然后对数组partition，k小于p放左，等于p放中间，大于p放右；

**3、** 然后看k是否在中间，是则返回，否则k在小于区则对小于区递归partition，k在大于区则对大于区递归做partition；

bfprt算法的方式是：

**1、** 非常讲究的选一个数p，不会随机；

**2、** 然后对数组partition，k小于p放左，等于p放中间，大于p放右；

**3、** 然后看k是否在中间，是则返回，否则k在小于区则对小于区递归partition，k在大于区则对大于区递归做partition；

所以两个方式的区别就是第一步，选p时有差异

### bfprt步骤

**1、** 分组排序，每5个数一组排序，每组组内排序是O(1)，的有n/5组，所以是O(n)；

**2、** 每组排好序后的中位数，拿出来，组成新的组m，数组m的长度是n/5；

**3、** 求数组m的中位数，这个中位数还是通过递归调bfprt算法求，bfprt(m,n/10)；

## bfprt比改写快排的优势

m数组中位数p，那么大于p的至少有n/10个（m数组中），然后每个数又是各自数组的中位数，所以回到各自的数组中，这n/10个数都有2个数大于它们，所以大于p的数至少有n * 3/10个，那么小于p的最多就是n * 7/10个

返回来也是一样的，小于p的数至少有n * 3/10个，大于p的最多就是n * 7/10个

所以运气再差，也就是在7/10的部分做partition

而改写快排的方式，这个最大代价是不确定的，有可能比7/10还大

## bfprt代码实现

```java
/**
 * 给定一个整形数组，返回其中第K小的数，bfprt算法求解
 *
 * bfprt算法的作用在于，随便取一个数作为分组的数，就可以通过表达式估算（按比例）出是否可以收敛到我们想要的时间复杂度
 * 例如以5位分组：
 * 1、组内排序，因为只有5个数，所以O(1)，总体O(n/5)，相当于O(n)
 * 2、中位数数组递归调用bfprt算法取中位数，这个是记为T(n/5)
 * 3、挑选出基准值后，在整个数组上进行荷兰国旗的划分，O(n)
 * 4、如果第k小的数（下标k-1）没有在划分后的range内，左右两侧选一侧进行递归，假设进的是左侧，那么排除掉中间区域和右侧区域的，剩余的就可以得出时间复杂度：
 *      因为基准值是中位数组中的中位数，所以在中位数数组中大于等于基准值的数的个数，是总数组大小的n/10（n/5/2）
 *      然后因为中位数组每个数都是5个数一组中的中位数，所以至少还有两被n/10的数比基准值大(大于等于基准值的数，在自己的分组内，都还有后面两个数也比基准值大)
 *      所以至少可以排除3n/10
 *      所以这里的时间复杂度记为T(7n/10)
 * 最后总的时间复杂度为O(n) + T(n/5) + T(7n/10) = O(n)
 *
 * Created by huangjunyi on 2022/9/9.
 */
public class Bfprt02 {
    public static int getMinKth(int[] arr, int k) {
        return bfprt(arr, 0, arr.length - 1, k - 1);
    }
    private static int bfprt(int[] arr, int l, int r, int index) {
        if (l == r) return arr[l];
        /*
        按照bfprt的策略挑选一个基准值
        l...r，5个数一组
        每组排序后取中位数
        组成新数组
        返回新数组的中位数pivot
         */
        int pivot = getPivot(arr, l, r);
        // 下面就和改写快排一样了
        //利用荷兰国旗问题进行分区，然后range为等于pivot的区间
        int[] range = partition(arr, l, r, pivot);
        //如果index位于range中间，直接返回arr[index]
        if (range[0] >= index && range[1] <= index) return arr[index];
        //否则递归调用bfprt算法进行处理
        else if (range[1] < index) return bfprt(arr, range[1] + 1, r, index);
        else return bfprt(arr, l, arr[0] - 1, index);
    }
    private static int[] partition(int[] arr, int l, int r, int pivot) {
        int low = l - 1;
        int high = r + 1;
        int i = l;
        while (i < high) {
            if (arr[i] < pivot) swap(arr, i++, ++low);
            else if (arr[i] > pivot) swap(arr, i, --high);
            else i++;
        }
        return new int[] {
     low + 1, high - 1};
    }
    /**
     * 根据bfprt算法，获取基准值
     * 把数组以5个一组分组，组内进行排序，然后把每组排序后的数翻入一个新数组中，最后递归调用bfprt算法返回该数组的中位数
     * @param arr 原数组
     * @param l 左下标
     * @param r 右下标
     * @return
     */
    private static int getPivot(int[] arr, int l, int r) {
        int size = r - l + 1;
        int offset = size % 5 == 0 ? 0 : 1;
        // 计算分组后有多少组，生成一个等长的数组
        int[] mArr = new int[size / 5 + offset];
        for (int i = 0; i < mArr.length; i++) {
            // 每5个数一组，排序取中位数，放入m数组
            int low = l + i * 5;
            mArr[i] = getMedian(arr, low, Math.min(r, low + 4));
        }
        // 递归调bfprt，取m数组中位数
        return bfprt(mArr, 0, mArr.length - 1, mArr.length / 2);
    }
    /**
     * 对数组进行插入排序后取其中位数
     * @param arr
     * @param l
     * @param r
     * @return
     */
    private static int getMedian(int[] arr, int l, int r) {
        // 插入排序
        insertSort(arr, l, r);
        // 取中位数
        return arr[(l + r) / 2];
    }
    private static void insertSort(int[] arr, int l, int r) {
        for (int i = l + 1; i <= r; i++) {
            for (int j = i - 1; j >= l; j--) {
                if (arr[j] > arr[j + 1]) swap(arr, j, j + 1);
            }
        }
    }
    private static void swap(int[] arr, int i, int j) {
        int temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
}
```

## 给定一个无序数组arr中，给定一个正数K，返回topK个最大的数

给定一个无序数组arr中，给定一个正数K，返回topK个最大的数

不同时间复杂度三个方法：

1）O(N * logN)

直接对原数组进行排序，然后取topK

2)O(N + K * logN)

先对数组进行从底往上的建堆，建一个大根堆

然后每次取堆顶，放入结果中

然后对堆进行调整

取K次
3)O(N + K * logK )

使用改写快排的方式，求 N - K 小的数 （N是数组长度），N - K小，相当于是第K大

然后准备一个长度为K的数组res

遍历原数组，只要大于这个第K大的数就收集

数组res剩下没填满的，就是等于这个第K大的数

然后对res数组做排序

## 蓄水池算法

蓄水池算法是用于解决这样的问题：

假设有一个源源不断吐出不同球的机器，

只有一个能装下10个球的袋子，每一个吐出的球，要么放入袋子，要么永远被扔掉

如何做到机器吐出每一个球之后，所有吐出的球都等概率被放入袋子里

这个机器相当于一个流，参数是源源不断的输入，不是一下子给定一个数组

步骤：
**1、** 如果袋子没满，求直接进袋子；

**2、** 如果袋子满了，假设现在是i号求，则实现一个函数，以10/i的概率决定i号球要不要进袋子；

**3、** 如果袋子满了，球又决定了要进袋子，袋子中原有的求等概率随机扔掉一个；

为什么这么左就是等概率呢？

假设又一个球是3号球

那么前10个球，3号球活下来的概率是100%

当第11号球到来时，11号球被选中的概率时10/11，那么3号球被淘汰的概率时 10/11 * 1/10 = 1/11，则3号球活下来的概率时10/11

当第12号球到来时，12号球被选中的概率时10/12，那么3号球被淘汰的概率时 10/12 * 1/10 = 1/12，则3号球活下来的概率时11/12

同理，当13号球到来时，3号球活下来的概率时12/13

假设到了20号球，则3号球活下来的概率时19/20

所以3号球一直存活的概率时

1 * 10/11 * 11/12 * 12/13 * … * 19 / 20 = 10 / 20

其他球的概率也是如此（包括号码大于10的球），所以是等概率

这个算法可以用在抽奖系统，比如每一时间段内第一次登陆的用户，都有等概率的中将机会。

假设中将名单10个人，那么准备一个大小为10的奖池

用一个变量记录当前首次登陆的用户是第几号登陆的用户，假设i，那么10/i概率决定该用户是否进奖池

如果要进奖池，则1/10概率淘汰掉奖池中的一个人

等时间段过了之后，公布奖池名单即可

相比之下就是相等时间过了，再收集这一段时间第一次登陆的用户，再决定中奖用户。
