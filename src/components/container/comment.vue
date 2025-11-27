<template>
  <div
    ref="commentContainerRef"
    class="umo-comment-container"
    :style="containerStyle"
  >
    <div class="umo-comment-header">
      <div class="umo-comment-title">
        <icon class="icon-comment" name="comment" />
        {{ t('comment.title') }}
      </div>
      <div class="umo-comment-actions">
        <div class="umo-dialog__close" @click="commentPanel = false">
          <icon name="close" />
        </div>
      </div>
    </div>

    <div class="umo-comment-tabs">
      <div
        class="umo-comment-tab"
        :class="{ active: activeTab === 'unresolved' }"
        @click="activeTab = 'unresolved'"
      >
        {{ t('comment.unresolved') }}
        <span class="umo-comment-count">{{ commentState.unresolvedCount }}</span>
      </div>
      <div
        class="umo-comment-tab"
        :class="{ active: activeTab === 'resolved' }"
        @click="activeTab = 'resolved'"
      >
        {{ t('comment.resolved') }}
        <span class="umo-comment-count">{{ commentState.resolvedCount }}</span>
      </div>
    </div>

    <div class="umo-comment-content umo-scrollbar">
      <div v-if="displayComments.length === 0" class="umo-comment-empty">
        {{ t('comment.empty') }}
      </div>

      <div
        v-for="comment in displayComments"
        :key="comment.id"
        class="umo-comment-item"
        :class="{ active: commentState.activeCommentId === comment.id }"
        @click="setActiveComment(comment.id)"
      >
        <div class="umo-comment-item-header">
          <div class="umo-comment-author">
            <img
              v-if="comment.author.avatar"
              :src="comment.author.avatar"
              class="umo-comment-avatar"
              :alt="comment.author.name"
            />
            <div v-else class="umo-comment-avatar-placeholder">
              {{ comment.author.name.charAt(0).toUpperCase() }}
            </div>
            <div class="umo-comment-author-info">
              <div class="umo-comment-author-name">{{ comment.author.name }}</div>
              <div class="umo-comment-time">{{ formatTime(comment.createdAt) }}</div>
            </div>
          </div>
          <div class="umo-comment-item-actions">
            <t-dropdown :options="getCommentActions(comment)">
              <icon name="more" class="umo-comment-more" />
            </t-dropdown>
          </div>
        </div>

        <div class="umo-comment-item-content">
          <div v-if="editingCommentId === comment.id" class="umo-comment-edit">
            <t-textarea
              v-model="editContent"
              :autosize="{ minRows: 2, maxRows: 6 }"
              :placeholder="t('comment.editPlaceholder')"
            />
            <div class="umo-comment-edit-actions">
              <t-button size="small" variant="outline" @click="cancelEdit">
                {{ t('comment.cancel') }}
              </t-button>
              <t-button size="small" @click="saveEdit(comment.id)">
                {{ t('comment.save') }}
              </t-button>
            </div>
          </div>
          <div v-else class="umo-comment-text">{{ comment.content }}</div>
        </div>

        <!-- 回复列表 -->
        <div v-if="comment.replies.length > 0" class="umo-comment-replies">
          <div
            v-for="reply in comment.replies"
            :key="reply.id"
            class="umo-comment-reply"
          >
            <div class="umo-comment-author">
              <img
                v-if="reply.author.avatar"
                :src="reply.author.avatar"
                class="umo-comment-avatar small"
                :alt="reply.author.name"
              />
              <div v-else class="umo-comment-avatar-placeholder small">
                {{ reply.author.name.charAt(0).toUpperCase() }}
              </div>
              <div class="umo-comment-author-info">
                <div class="umo-comment-author-name">{{ reply.author.name }}</div>
                <div class="umo-comment-time">{{ formatTime(reply.createdAt) }}</div>
              </div>
            </div>
            <div class="umo-comment-text">{{ reply.content }}</div>
          </div>
        </div>

        <!-- 回复输入框 -->
        <div v-if="replyingCommentId === comment.id" class="umo-comment-reply-input">
          <t-textarea
            v-model="replyContent"
            :autosize="{ minRows: 2, maxRows: 4 }"
            :placeholder="t('comment.replyPlaceholder')"
          />
          <div class="umo-comment-reply-actions">
            <t-button size="small" variant="outline" @click="cancelReply">
              {{ t('comment.cancel') }}
            </t-button>
            <t-button size="small" @click="submitReply(comment.id)">
              {{ t('comment.reply') }}
            </t-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Comment } from '@/types'
import { useComment } from '@/composables/comment'

const container = inject('container')
const editor = inject('editor')
const commentPanel = inject('commentPanel')
const options = inject('options')
const injectedCommentState = inject('commentState')

// 获取当前用户，如果未配置则使用默认用户
const getCurrentUser = () => {
  return options.value.comment?.currentUser || {
    id: 'default-user',
    name: t('comment.defaultUser'),
  }
}

// 初始化批注状态
const commentState = useComment(editor, getCurrentUser())

// 将 commentState 暴露给其他组件
if (injectedCommentState) {
  injectedCommentState.value = commentState
}

// 批注容器引用和位置样式
const commentContainerRef = ref<HTMLElement | null>(null)
const containerStyle = ref({
  top: '0px',
  right: '20px',
})

const activeTab = ref<'unresolved' | 'resolved'>('unresolved')
const editingCommentId = ref<string | null>(null)
const editContent = ref('')
const replyingCommentId = ref<string | null>(null)
const replyContent = ref('')

const displayComments = computed(() => {
  if (activeTab.value === 'unresolved') {
    return commentState.getUnresolvedComments()
  }
  return commentState.getResolvedComments()
})

const setActiveComment = (commentId: string) => {
  commentState.setActiveComment(commentId)
  updateCommentPosition(commentId)
}

// 更新批注面板位置
const updateCommentPosition = (commentId: string | null) => {
  if (!commentId || !editor.value) {
    return
  }

  // 使用 nextTick 并增加小延迟确保 DOM 已更新
  nextTick(() => {
    setTimeout(() => {
      // 尝试多种方式获取容器元素
      let containerEl: HTMLElement | null = null

      // 方式1: 使用 container 选择器
      if (container && container.value) {
        containerEl = document.querySelector(container.value) as HTMLElement
      }

      // 方式2: 如果没有找到，使用编辑器元素的父容器
      if (!containerEl && editor.value) {
        const editorEl = editor.value.view?.dom
        if (editorEl) {
          containerEl = editorEl.closest('.umo-editor-container') as HTMLElement
        }
      }

      // 方式3: 查找任何 umo-editor-container
      if (!containerEl) {
        containerEl = document.querySelector('.umo-editor-container') as HTMLElement
      }

      if (!containerEl) {
        console.warn('Container element not found, using default position')
        containerStyle.value = {
          top: '20px',
          right: '20px',
          maxHeight: '600px',
        }
        return
      }

      const commentElement = containerEl.querySelector(
        `span[data-comment-id="${commentId}"]`,
      ) as HTMLElement

      if (commentElement) {
        const rect = commentElement.getBoundingClientRect()
        const containerRect = containerEl.getBoundingClientRect()

        // 计算相对于容器的位置
        const top = rect.top - containerRect.top
        const maxHeight = containerRect.height - top - 20

        containerStyle.value = {
          top: `${Math.max(20, top)}px`,
          right: '20px',
          maxHeight: `${Math.min(600, maxHeight)}px`,
        }
      } else {
        // 如果找不到批注元素，显示默认位置
        containerStyle.value = {
          top: '20px',
          right: '20px',
          maxHeight: '600px',
        }
      }
    }, 50)
  })
}

// 监听活动批注变化
watch(
  () => commentState.activeCommentId,
  (newId) => {
    if (newId) {
      updateCommentPosition(newId)
    }
  },
)

// 监听批注点击事件
const handleCommentClick = (event: CustomEvent) => {
  const { commentId } = event.detail
  // 确保批注面板打开
  if (!commentPanel.value) {
    commentPanel.value = true
  }
  // 等待面板渲染后再设置活动批注
  nextTick(() => {
    setActiveComment(commentId)
  })
}

// 监听窗口大小变化
const handleResize = () => {
  if (commentState.activeCommentId) {
    updateCommentPosition(commentState.activeCommentId)
  }
}

// 点击外部关闭批注面板
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (
    commentContainerRef.value &&
    !commentContainerRef.value.contains(target) &&
    !target.closest('.umo-comment')
  ) {
    // 点击在批注容器和批注标记之外，关闭面板
    commentPanel.value = false
    commentState.activeCommentId = null
  }
}

onMounted(() => {
  document.addEventListener('comment-click', handleCommentClick as EventListener)
  window.addEventListener('resize', handleResize)
  document.addEventListener('click', handleClickOutside)

  // 如果已经有活动批注，更新位置
  if (commentState.activeCommentId) {
    updateCommentPosition(commentState.activeCommentId)
  } else if (displayComments.value.length > 0) {
    // 如果没有活动批注但有批注列表，选择第一个批注
    nextTick(() => {
      const firstComment = displayComments.value[0]
      if (firstComment) {
        setActiveComment(firstComment.id)
      }
    })
  }
})

onUnmounted(() => {
  document.removeEventListener('comment-click', handleCommentClick as EventListener)
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('click', handleClickOutside)
})

const getCommentActions = (comment: Comment) => {
  const actions = [
    {
      content: t('comment.reply'),
      onClick: () => startReply(comment.id),
    },
    {
      content: t('comment.edit'),
      onClick: () => startEdit(comment.id, comment.content),
    },
  ]

  if (comment.resolved) {
    actions.push({
      content: t('comment.reopen'),
      onClick: () => commentState.reopenComment(comment.id),
    })
  } else {
    actions.push({
      content: t('comment.resolve'),
      onClick: () => commentState.resolveComment(comment.id),
    })
  }

  actions.push({
    content: t('comment.delete'),
    onClick: () => commentState.deleteComment(comment.id),
  })

  return actions
}

const startEdit = (commentId: string, content: string) => {
  editingCommentId.value = commentId
  editContent.value = content
}

const cancelEdit = () => {
  editingCommentId.value = null
  editContent.value = ''
}

const saveEdit = (commentId: string) => {
  if (editContent.value.trim()) {
    commentState.updateComment(commentId, editContent.value)
    cancelEdit()
  }
}

const startReply = (commentId: string) => {
  replyingCommentId.value = commentId
  replyContent.value = ''
}

const cancelReply = () => {
  replyingCommentId.value = null
  replyContent.value = ''
}

const submitReply = (commentId: string) => {
  if (replyContent.value.trim()) {
    commentState.addReply(commentId, replyContent.value)
    cancelReply()
  }
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) {
    return t('comment.justNow')
  } else if (diff < 3600000) {
    return t('comment.minutesAgo', { minutes: Math.floor(diff / 60000) })
  } else if (diff < 86400000) {
    return t('comment.hoursAgo', { hours: Math.floor(diff / 3600000) })
  } else if (diff < 604800000) {
    return t('comment.daysAgo', { days: Math.floor(diff / 86400000) })
  } else {
    return date.toLocaleDateString()
  }
}
</script>
