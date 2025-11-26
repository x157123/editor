# 批注功能使用文档

## 功能概述

批注功能类似于 Microsoft Word 中的批注功能，允许用户在文档中添加批注、回复批注、解决批注等操作。当开启批注模式后，页面的所有更改都会自动加上批注标记。

## 如何开启批注功能

1. 点击工具栏上方的"**页面**"标签
2. 在"页面"工具栏中找到"**批注**"按钮（带有对话气泡图标）
3. 点击批注按钮，右侧会弹出批注面板
4. 在批注面板中点击"**开启批注模式**"按钮即可开始使用批注功能

## 核心功能

### 1. 批注模式
- **开启/关闭批注模式**：点击批注面板中的"开启批注模式"按钮
- **批注模式开启后**：所有文本输入和粘贴操作都会自动添加批注标记

### 2. 批注管理
- **添加批注**：选中文本后可以添加批注内容
- **编辑批注**：点击批注项的更多菜单选择"编辑"
- **删除批注**：点击批注项的更多菜单选择"删除"
- **解决批注**：将批注标记为已解决
- **重新打开批注**：将已解决的批注重新打开

### 3. 批注回复
- **添加回复**：点击批注项的更多菜单选择"回复"
- **多级回复**：支持对批注进行多次回复

### 4. 批注导航
- **定位批注**：点击批注项可自动滚动到对应文本位置
- **高亮显示**：批注文本带有黄色背景和下划线标记

## 技术实现

### 1. 类型定义

在 `types/index.d.ts` 中定义了以下接口：

```typescript
// 批注作者
export interface CommentAuthor {
  id: string
  name: string
  avatar?: string
}

// 批注回复
export interface CommentReply {
  id: string
  content: string
  author: CommentAuthor
  createdAt: number
}

// 批注
export interface Comment {
  id: string
  content: string
  author: CommentAuthor
  createdAt: number
  updatedAt?: number
  resolved: boolean
  replies: CommentReply[]
}

// 批注配置
export interface CommentOptions {
  enabled?: boolean
  currentUser?: CommentAuthor
  onChange?: (comments: Comment[]) => void
  onResolve?: (commentId: string) => void
  onDelete?: (commentId: string) => void
}
```

### 2. Tiptap 扩展

`src/extensions/comment.ts` 实现了一个 Mark 扩展：

- **Mark 属性**：`commentId` - 批注的唯一标识
- **批注模式**：通过 ProseMirror Plugin 实现批注模式下的自动标记
- **Commands**：
  - `setComment(commentId)` - 添加批注标记
  - `unsetComment(commentId?)` - 移除批注标记
  - `toggleCommentMode()` - 切换批注模式
  - `getAllComments()` - 获取所有批注
  - `focusComment(commentId)` - 定位到指定批注
  - `deleteComment(commentId)` - 删除指定批注标记

### 3. Composition API

`src/composables/comment.ts` 提供批注状态管理：

```typescript
const commentState = useComment(editor, currentUser)

// 可用的方法和属性
commentState.comments           // 批注Map
commentState.commentMode        // 批注模式状态
commentState.activeCommentId    // 当前活动批注ID
commentState.currentUser        // 当前用户
commentState.toggleCommentMode()  // 切换批注模式
commentState.addComment()       // 添加批注
commentState.updateComment()    // 更新批注
commentState.deleteComment()    // 删除批注
commentState.resolveComment()   // 解决批注
commentState.reopenComment()    // 重新打开批注
commentState.addReply()         // 添加回复
commentState.deleteReply()      // 删除回复
commentState.setActiveComment() // 设置活动批注
commentState.getAllComments()   // 获取所有批注
commentState.getUnresolvedComments() // 获取未解决的批注
commentState.getResolvedComments()   // 获取已解决的批注
commentState.commentCount       // 批注总数
commentState.unresolvedCount    // 未解决批注数
commentState.resolvedCount      // 已解决批注数
```

### 4. UI 组件

`src/components/container/comment.vue` 提供批注面板UI：

- **批注列表**：显示所有批注，支持切换已解决/未解决标签
- **批注详情**：显示批注内容、作者、时间、回复列表
- **批注操作**：编辑、删除、解决、回复等操作
- **可调整大小**：支持拖拽调整面板宽度

### 5. 样式

`src/assets/styles/comment.less` 提供完整的样式支持：

- **批注标记样式**：黄色背景 + 底部边框
- **批注面板样式**：侧边栏布局，支持暗色主题
- **响应式设计**：适配不同屏幕尺寸

## 使用示例

### 基本使用

```vue
<template>
  <umo-editor
    :comment="{
      enabled: true,
      currentUser: {
        id: 'user1',
        name: '张三',
        avatar: 'https://example.com/avatar.jpg'
      },
      onChange: handleCommentChange,
      onResolve: handleCommentResolve,
      onDelete: handleCommentDelete
    }"
  />
</template>

<script setup>
const handleCommentChange = (comments) => {
  console.log('批注变更:', comments)
  // 保存到后端
}

const handleCommentResolve = (commentId) => {
  console.log('批注已解决:', commentId)
}

const handleCommentDelete = (commentId) => {
  console.log('批注已删除:', commentId)
}
</script>
```

### 程序化操作

```javascript
// 获取编辑器实例
const editor = editorRef.value.getEditor()

// 添加批注标记
editor.commands.setComment('comment-123')

// 移除批注标记
editor.commands.unsetComment('comment-123')

// 切换批注模式
editor.commands.toggleCommentMode()

// 获取所有批注
const comments = editor.commands.getAllComments()

// 定位到批注
editor.commands.focusComment('comment-123')

// 删除批注标记
editor.commands.deleteComment('comment-123')
```

## 数据持久化

批注数据通过以下方式持久化：

1. **编辑器内容**：批注标记保存在HTML/JSON内容中
2. **批注元数据**：使用`onChange`回调保存批注详细信息到后端
3. **导入导出**：支持导出和导入批注数据

```javascript
// 导出批注
const jsonData = commentState.exportComments()

// 导入批注
commentState.importComments(jsonData)
```

## 国际化支持

批注功能支持中英文双语：

**中文 (zh-CN)**：
- 批注
- 批注模式已开启
- 未解决/已解决
- 回复、编辑、删除、解决

**英文 (en-US)**：
- Comments
- Comment Mode On
- Unresolved/Resolved
- Reply, Edit, Delete, Resolve

## 键盘快捷键

（可扩展实现）
- `Ctrl/Cmd + Alt + M` - 切换批注模式
- `Ctrl/Cmd + Alt + C` - 添加批注
- `Esc` - 关闭批注面板

## 注意事项

1. **用户配置**：必须设置`currentUser`才能添加批注
2. **权限控制**：可以通过回调函数实现权限验证
3. **性能优化**：大量批注时建议使用虚拟滚动
4. **兼容性**：确保浏览器支持ES6+特性

## 扩展开发

### 自定义批注样式

```less
.umo-comment {
  background-color: rgba(your-color);
  border-bottom-color: your-color;
}
```

### 自定义批注行为

可以通过扩展 Comment Mark 实现自定义行为：

```typescript
import Comment from './extensions/comment'

const CustomComment = Comment.extend({
  // 自定义配置
  addOptions() {
    return {
      ...this.parent?.(),
      customOption: true
    }
  }
})
```

## 未来规划

- [ ] 批注协作实时同步（基于Yjs）
- [ ] 批注导出到Word文档
- [ ] 批注统计和报表
- [ ] 批注权限管理
- [ ] 批注模板
- [ ] 批注提醒通知

## 技术支持

如有问题，请提交 Issue 或联系开发团队。
