# 23、算法与数据结构 - 实战：IndexTree、AC自动机
- 来源：https://ddkk.com/zhuanlan/algorithm/6/23.html
- 分类：数据结构
- 分组：教程目录
## IndexTree的作用

用于快速查询区间累加和

如果不用IndexTree，一般的做法是生成一个前缀和数组

比如原数组arr = [3, -2, 1, 5, 0]

那么前缀和数组help = [3, 1, 2, 7, 7]

如果此时要查3~4的累加和，只需help[4] - help[2]

但是这样有个问题，如果arr数组的某个值修改了的话，那么help数组的一大片区域都要跟着变，比如现在修改arr数组 arr[2] = 3，那么help数组下标2后面的都要跟着改变。这里的arr和help两个数组长度都是5，如果长度很长的话，效率就会很差。

IndexTree就是支持快速更新，快速查询区间和的结构。

这个功能线段树也可以实现，IndexTree只支持单点更新，不能像线段树那样进行范围更新。

## IndexTree的实现细节

IndexTree以数组实现，下标从1开始。

假设原数组arr长度13，下标从1~12

那么help数组是这样：

help[1] = arr[1]

help[2] = arr[1…2]

help[3] = arr[3]

help[4] = arr[1…4]

help[5] = arr[5]

help[6] = arr[5…6]

help[7] = arr[7]

help[8] = arr[1…8]

help[9] = arr[9]

help[10] = arr[9…10]

help[11] = arr[11]

help[12] = [9…12]

简单来说就是能凑成一对（长度一样）的就凑成一对，弄到help数组中

help数组一个下标i对应的原数组范围，是这样计算：

i下标的二进制，假设010111000，最右边的1去掉，然后加1，010110001

那么help[i]负责的范围就是 010110001~010111000

利用IndexTree进行前缀和计算：

取该位置的二进制的值a，累加help[a]

然后a的二进制最右侧1去掉，得b，累加help[b]

然后b的二进制最右侧1去掉，得c，累加help[c]

以此类推，直至到0

比如查询arr数组1~i的前缀和（注意0下标是不用的）

假设i的二进制是01001100

那么前缀和就是help[01001100] + help[01001000] + help[01000000]

利用IndexTree进行区间范围计算，就是两个前缀和相减

IndexTree的add操作：

目标位置为a，

那么更新a位置，

然后a加一个自己最右侧的1，得b，更新b位置的值，

然后b加一个自己最右侧的1，得c，更新c位置的值

依次类推，直至越界

## IndexTree代码实现

```java
    /**
     * IndexTree 树状数组，更新和区间范围查询都是O(logN)的数据结构
     * 一维IndexTree
     *
     * 原理：
     * 0位置不用，从1位置开始
     * 奇数位置只存自己的值
     * 偶数位则有讲究
     * 2 -> 1~2
     * 4 -> 1~4
     * 6 -> 5~6
     * 8 -> 1~8
     * 间隔大的覆盖间隔小的，
     * 例如1~4,5~8为2个4的间隔，1~8是1个8的间隔，那么8位置存1~8的值，因为8间隔更大
     * 16间隔，32间隔也是如此，在一个位置上凑齐了一个间隔，就存这个间隔间的数的和，凑齐多个间隔去较大的
     *
     * 存储计算：
     * 取该位置的二进制的值a，去掉最右侧1后得b，然后b+1得c，累加c~a的值，就是该位置要存的值
     *
     * 前缀和查询计算：
     * 取该位置的二进制的值a，累加help[a]
     * 然后a的二进制最右侧1去掉，得b，累加help[b]
     * 然后b的二进制最右侧1去掉，得c，累加help[c]
     * 以此类推，直至到0
     *
     * 区间范围查询：
     * 两个前缀和相减
     *
     * 更新计算：
     * 目标位置为a，
     * 那么更新a位置，
     * 然后a加一个自己最右侧的1，得b，更新b位置的值，
     * 然后b加一个自己最右侧的1，得c，更新c位置的值
     * 依次类推，直至越界
     */
    class IndexTree {
        int[] tree;
        int N;
        public IndexTree(int size) {
            this.N = size;
            // 0位置不用，所以准备长度加1的长度
            this.tree = new int[N + 1];
        }
        // IndexTree前缀和查询
        public int sum(int index) {
            int res = 0;
            while (index > 0) {
      // 直至到0
                res += tree[index];
                // 进制最右侧1去掉
                index -= index & -index;
            }
            return res;
        }
        // IndexTree单点增加操作
        public void add(int index, int d) {
            while (index <=  N) {
      // 直至越界
                tree[index] += d;
                // 加一个自己最右侧的1
                index += index & -index;
            }
        }
    }
```

## 与线段树的区别

线段树改成二维的话，非常的复杂，但是二维的IndexTree，就很好改了。

比如二维的IndexTree，进行一个单独更新，那么哪些行和哪些列受影响呢？

这个范围的计算，其实是和一维IndexTree是一样的，因为二维IndexTree里面就是二维数组 int[][] tree，行和列的范围都是和一维IndexTree一样。

## 实现二维矩阵更新和区间范围查询都是O(logN)的数据结构

其实就是二维IndexTree

```java
/**
 * 实现二维矩阵更新和区间范围查询都是O(logN)的数据结构
 * Created by huangjunyi on 2022/11/9.
 */
public class _130二维区域和检索_可变 {
    class RangeSumQuery2DMutable {
        int[][] tree;
        int[][] nums;
        int N;
        int M;
        public RangeSumQuery2DMutable(int[][] matrix) {
            this.N = matrix.length;
            this.M = matrix[0].length;
            tree = new int[this.N + 1][this.M + 1];
            nums = new int[this.N][this.M];
            for (int i = 0; i < N; i++) {
                for (int j = 0; j < M; j++) {
                    update(i, j, matrix[i][j]);
                }
            }
        }
        /**
         * 二维矩阵前缀累加和
         * @param row
         * @param col
         * @return
         */
        private int sum(int row, int col) {
            int res = 0;
            for (int i = row + 1; i > 0; i -= i & -i) {
                for (int j = col + 1; j > 0; j -= j & -j) {
                    res += tree[i][j];
                }
            }
            return res;
        }
        /**
         * 二维矩阵更新
         * @param row
         * @param col
         * @param val
         */
        public void update(int row, int col, int val) {
            int add = val - nums[row][col];
            nums[row][col] = val;
            for (int i = row + 1; i < N; i += i & -i) {
                for (int j = col + 1; j < M; j += j & -j) {
                    tree[i][j] += add;
                }
            }
        }
        /**
         * 二维矩阵区间范围查询
         * @param row1 左上方行数
         * @param col1 左上方列数
         * @param row2 右下方行数
         * @param col2 右下方列数
         * @return
         */
        public int sumRegion(int row1, int col1, int row2, int col2) {
            return sum(row2, col2) + sum(row1 - 1, col1 - 1) - sum(row1 - 1, col2) - sum(row2, col1 - 1);
        }
    }
}
```

## AC自动机

AC自动机，相当于是在前缀树上玩KMP。

作用：
假设有一个词典dictionary，然后有一篇文章article，在article中匹配看都出现了dictionary中的哪些词。

步骤：
**1、** dictionary建成前缀树；

**2、** 修改前缀树，增加fail指针头节点fail指针指向空；头节点的下层第一级节点fail指针指向头节点；其他节点的fail指针，假设父节点走到当前节点的路为a，看父节点fail指针指向的节点X，是否有相同的路a，有则指向X节点路a下的节点，没有则看X节点的fail指针指向的节点Y，是否有相同的路a…，如果都没有（沿着fail指针遍历到空），那么fail指针指向头节点；

**3、** 利用这个修改后的前缀树，进行大文章article的遍历匹配，如果匹配失败，沿着fail指针往下走，继续匹配，不会错过答案；

**4、** 每次在前缀树中往下走了一步，就站在这个节点原地，另外那一follow指针，验证fail指针看一遍，看有没有单词匹配成功可以收集；

fail指针含义：

如果匹配失败了，看dictionary剩下的单词，哪个单词的前缀prefix，和这个匹配失败的单词到匹配失败的字符为止的这一段的后缀suffix，匹配的长度最长的，跳到这个单词继续匹配。这样就不会错过任何可以匹配成功的可能性，也可以跳过绝对不可能匹配成功的部分。

代码：

```java
/**
 * AC自动机
 * Created by huangjunyi on 2022/9/17.
 */
public class ACAutomation {
    private static class Node {
        private String end; // 如果这个结点是某个字符串的结尾，则end不为null
        private boolean visited; // 访问到end不为null，收集答案后，下次再到这个结点，visited就为true，就不重复收集了
        private Node fail; // fail指针
        private Node[] nexts; // 路径数组
        public Node() {
            end = null;
            visited = false;
            fail = null;
            nexts = new Node[26];
        }
    }
    private Node root;
    public ACAutomation() {
        root = new Node();
    }
    public void insert(String str) {
        //以构建前缀树的方式插入字符串
        char[] chars = str.toCharArray();
        Node cur = this.root;
        for (int i = 0; i < chars.length; i++) {
            // 没路就新建，有路就复用
            int index = chars[i] - 'a';
            if (cur.nexts[index] == null) {
                cur.nexts[index] = new Node();
            }
            cur = cur.nexts[index];
        }
        //当前节点时该字符串的结尾字符，设置当前节点的end属性为当前字符串
        cur.end = str;
    }
    public void build() {
        //以宽度优先遍历的方式为每个节点设置fail指针
        Queue<Node> queue = new LinkedList<>();
        queue.add(this.root);
        Node cur = null;
        Node curFail = null;
        while (!queue.isEmpty()) {
            //弹出当前节点，为当前节点的每个子结点设置fail指针
            cur = queue.poll();
            //遍历每个子节点，为它们设置fail指针
            for (int i = 0; i < cur.nexts.length; i++) {
                Node next = cur.nexts[i];
                if (next == null) continue;
                //当前父节点的fail指针
                curFail = cur.fail;
                //如果当前fail指针没有走向i的路，继续找，要么找到，要么一直到null
                while (curFail != null && curFail.nexts[i] == null) {
                    curFail = curFail.fail;
                }
                //curFail为null，代表没找到，设置子结点的fail指针指向头结点，不为null则表示找到了
                if (curFail == null) {
                    next.fail = this.root;
                } else {
                    // 子节点的fail指针，指向curFail指向节点i路上的节点
                    next.fail = curFail.nexts[i];
                }
                queue.add(next);
            }
        }
    }
    public List<String> getContainsWords(String content) {
        char[] chars = content.toCharArray();
        List<String> res = new ArrayList<>();
        Node cur = this.root;
        for (int i = 0; i < chars.length; i++) {
            int path = chars[i] - 'a';
            // 没有路，沿着fail指针找路
            while (cur.nexts[path] == null && cur != this.root) cur = cur.fail;
            //找到路了，cur要往前推进，没有则回到root节点
            cur = cur.nexts[path] != null ? cur.nexts[path] : this.root;
            //用follow指针遍历从cur开始沿着fail指针走到root的路径，收集答案
            Node follow = cur;
            while (follow != this.root) {
                // 看过了，不再看了
                if (follow.visited) break;
                if (follow.end != null) {
                    // 标记看过了
                    res.add(follow.end);
                    follow.visited = true;
                }
                follow = follow.fail;
            }
        }
        return res;
    }
    public static void main(String[] args) {
        ACAutomation acAutomation = new ACAutomation();
        acAutomation.insert("abc");
        acAutomation.insert("abcd");
        acAutomation.insert("bcdx");
        acAutomation.build();
        List<String> res = acAutomation.getContainsWords("abcdda");
        System.out.println(res);
    }
}
```
