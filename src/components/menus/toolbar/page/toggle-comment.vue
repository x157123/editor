<template>
  <menus-button
    ico="comment"
    :text="t('comment.title')"
    huge
    :disabled="!hasSelection"
    :tooltip="hasSelection ? t('comment.add') : t('comment.selectTextFirst')"
    @menu-click="handleClick"
  />
  <comment-dialog
    :visible="dialogVisible"
    :selected-text="selectedText"
    :current-user="currentUser"
    @confirm="handleAddComment"
    @close="dialogVisible = false"
  />
</template>

<script setup lang="ts">
import CommentDialog from './comment-dialog.vue'
import { shortId } from '@/utils/short-id'

const editor = inject('editor')
const commentPanel = inject('commentPanel')
const options = inject('options')
const container = inject('container')
const commentState = inject('commentState')

const dialogVisible = ref(false)
const selectedText = ref('')
const currentUser = computed(() => options.value.comment?.currentUser)

// 检查是否有选中文本
const hasSelection = computed(() => {
  if (!editor.value) return false
  const { from, to } = editor.value.state.selection
  return from !== to
})

const handleClick = () => {
  if (!editor.value || !hasSelection.value) return

  // 获取选中的文本
  const { from, to } = editor.value.state.selection
  selectedText.value = editor.value.state.doc.textBetween(from, to, ' ')

  // 打开对话框
  dialogVisible.value = true

  // 同时打开批注面板
  if (!commentPanel.value) {
    commentPanel.value = true
  }
}

const handleAddComment = (content: string) => {
  if (!editor.value) return

  // 获取当前用户，如果没有配置则使用默认用户
  const user = currentUser.value || {
    id: 'default-user',
    name: t('comment.defaultUser'),
  }

  const commentId = shortId()

  // 添加批注标记到选中文本
  editor.value.commands.setComment(commentId)

  // 添加批注数据到 commentState
  if (commentState.value) {
    commentState.value.addComment(content, commentId)
    commentState.value.setActiveComment(commentId)
  }

  // 触发批注变更回调
  if (options.value.comment?.onChange) {
    const { from, to } = editor.value.state.selection
    options.value.comment.onChange(commentId, {
      from,
      to,
      content,
      author: user,
      createdAt: Date.now(),
    })
  }

  // 关闭对话框
  dialogVisible.value = false

  // 显示成功消息
  useMessage('success', {
    attach: container,
    content: t('comment.addSuccess'),
  })

  // 确保批注面板打开
  if (!commentPanel.value) {
    commentPanel.value = true
  }
}
</script>
