---
title: "Noosphere，一种思维协议。（Draft）"
description: "Noosphere是一种思想协议。它建立在IPFS之上，构成了一个全球性的知识图谱。"
pubDate: 2023-05-27T10:11:14.864Z
source: "Medium"
originalUrl: "https://medium.com/@conanxin/noosphere-%E4%B8%80%E7%A7%8D%E6%80%9D%E7%BB%B4%E5%8D%8F%E8%AE%AE-draft-7cd8504cbc74"
draft: false
---

::: {#5f9b .section .section .section--body .section--first .section--last}
::: section-divider

------------------------------------------------------------------------
:::

::: section-content
::: {.section-inner .sectionLayout--insetColumn}
### Noosphere，一种思维协议。（Draft） {#b911 .graf .graf--h3 .graf--leading .graf--title name="b911"}

Noosphere是一种思想协议。它建立在IPFS之上，构成了一个全球性的知识图谱。

-   [全球性的知识图谱。Noosphere是由许多公共和私人小型图形组成的大规模多人共享图形。]{#c316}
-   [用户拥有数据。应用程序将思想困在SaaS孤岛中，而Noosphere则解决了这个问题。所有内容都被同步到IPFS上，因此您可以通过任何IPFS节点进行可信退出。]{#f2ad}
-   [自我主权身份认证。使用UCAN时，身份验证通过用户拥有的密钥而不是ID完成。]{#76a7}
-   [本地优先同步。一切都可以离线无缝运行，并且文件可以实时同步到您的设备上。]{#b7da}
-   [基于IPFS去中心化。 Noosphere是点对点的，使其成为人类知识持久存储库。"多重副本保持安全"。]{#63af}

名称？Noosphere意味着行星意识，这是从生物圈中产生出来的一种假设新进化现象。这只是一个轻松愉快的玩笑，也代表我们对未来发展方向充满期望：希望Noosphere能够成为一个用户拥有、集体思考交流平台。

Noosphere是一个无需许可的协议，就像HTTP或IMAP一样。您可以在其之上构建任何您喜欢的东西。我们将使用Noosphere来支持Subconscious的多人游戏和同步功能。我们希望其他应用程序也会发现它有用。

### Memos：一个版本化的笔记封套 {#848f .graf .graf--h3 .graf-after--p name="848f"}

<figure id="c377" class="graf graf--figure graf-after--h3">
<img src="https://cdn-images-1.medium.com/max/800/0*kfACa40BAl6eSN3u.png" class="graf-image" data-image-id="0*kfACa40BAl6eSN3u.png" data-width="1400" data-height="440" data-is-featured="true" />
</figure>

在Noosphere图中，节点被称为Memos。它们是带有IPLD元数据信封的：

-   [头部包含任意元数据]{#3167}
-   [一个body CID，指向内容]{#1119}
-   [一个parent CID，指向备忘录的上一版本。]{#3d6e}

你可以把任何东西放进Memos里！Memos的body CID可以指向任何类型的数据，由Content-Type头部表示。JSON、Markdown、二进制数据等等都可以满足你应用程序的需求。这使得Noosphere成为了一种通用协议，不仅适用于笔记应用。

如果你认为这看起来有点像HTTP，那么没错！Memos格式很时髦。与HTTP、电子邮件或分组一样，Noosphere使用头部作为机制来实现开放式演化。

Memos还具有父CID，它指向先前版本。通过跟随父CID，在给定memo的版本历史记录中进行追踪。这使得Noosphere几乎像IPFS上轻量级Git一样，并提供了构建块以进行更改历史记录、回滚和同步。

### Spheres：笔记集 {#7acf .graf .graf--h3 .graf-after--p name="7acf"}

Noosphere是一个由公共和私人子图组成的大规模多人知识图谱。每个子图都由一个作者拥有，该作者使用加密密钥进行签名。我们称这些子图为"Spheres"。

Spheres本质上是将...

-   [\@句柄映射到公钥]{#8dd2}
-   [/路径映射到CIDs]{#0c18}

您可以将球视为个人通讯录。如果您拥有自己的Spheres，则还可用作数据背包和自我主权社交图表，因为如果您拥有自己的Spheres，则可以从任何IFPS节点访问数据所需的所有指针。可信退出！

Spheres还驱动了一种宠物名链接系统，一种超级本地分布式DNS。

<figure id="8f51" class="graf graf--figure graf-after--p">
<img src="https://cdn-images-1.medium.com/max/800/0*g-pxnct3luU0ztsb.png" class="graf-image" data-image-id="0*g-pxnct3luU0ztsb.png" data-width="1358" data-height="628" />
</figure>

你可以将链接[\@gordon/composability](http://twitter.com/gordon/composability "Twitter profile for @gordon/composability"){.markup--anchor .markup--p-anchor data-href="http://twitter.com/gordon/composability" rel="noopener" target="_blank"}看作是"给我最新版本的gordon名为composability的memo"。

这类似于URL中起源和路径的概念。当我链接到[http://example.com/composability](http://example.com/composability){.markup--anchor .markup--p-anchor data-href="http://example.com/composability" rel="nofollow noopener" target="_blank"}时，我的意思是"给我example.com名为composability的资源"。情节转折在于Spheres不指向特定服务器！相反，Spheres是存储在IPFS上的数据结构。因此，在Noosphere上进行寻址完全分散化，Spheres和memo可以同时存在于许多对等方。这使得Noosphere非常具有弹性。

### Sphere服务器：您的个人IPFS网关 {#b8e8 .graf .graf--h3 .graf-after--p name="b8e8"}

因此，memo是内容的信封，而Spheres则是memo和用户公钥的地址簿。这涵盖了Noosphere核心数据结构。但是谁负责解析链接并与IPFS通信呢？Sphere服务器！

<figure id="99f8" class="graf graf--figure graf-after--p">
<img src="https://cdn-images-1.medium.com/max/800/0*nHZEUJ7Q5eRMiWeT.png" class="graf-image" data-image-id="0*nHZEUJ7Q5eRMiWeT.png" data-width="1400" data-height="1551" />
</figure>

Sphere服务器是超级节点，个人IPFS网关，位于云中并执行一些有用的任务。您的Sphere服务器可以：

-   [与IPFS通信]{#9a5e}
-   [将您的memo和Sphere更新发布到DHT]{#5483}
-   [固定您的内容，并缓存来自其他关注者Sphere的副本]{#3c93}
-   [解析宠物名字，就像超局域网DNS解析器一样]{#36d2}
-   [向跟随您的Sphere服务器传递宠物名字更新]{#c8ac}
-   [桥接到Web上]{#69f9}
-   [与客户端应用程序同步]{#169a}

这里没有太多魔法。 Sphere服务器基本上是带有少量IPFS覆盖层的无聊Web2服务器。 Web 2.5？这为我们提供了一些高质量的对等方，可以缓存和固定内容，并可靠地响应请求。它还让我们避免了尝试将耗电完整节点压缩到移动设备上所面临的难题。移动客户端只需通过HTTP与服务器通信即可。我们认为这些超级节点达成了实际平衡，既提供了云计算性能和可靠性，又具备IPFS弹性和可信退出。

原文：[Noosphere, a protocol for thought](https://subconscious.substack.com/p/noosphere-a-protocol-for-thought?utm_source=su){.markup--anchor .markup--p-anchor data-href="https://subconscious.substack.com/p/noosphere-a-protocol-for-thought?utm_source=su" rel="noopener" target="_blank"}
:::
:::
:::
