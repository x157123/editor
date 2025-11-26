<template>
  <modal
    :visible="visible"
    width="500px"
    @confirm="handleConfirm"
    @close="handleClose"
  >
    <template #header>
      <icon name="comment" />
      {{ isEdit ? t('comment.edit') : t('comment.add') }}
    </template>
    <div class="umo-comment-dialog">
      <div class="umo-comment-dialog-info">
        <div class="umo-comment-author">
          <img
            v-if="currentUser?.avatar"
            :src="currentUser.avatar"
            class="umo-comment-avatar"
            :alt="currentUser.name"
          />
          <div v-else class="umo-comment-avatar-placeholder">
            {{ currentUser?.name?.charAt(0).toUpperCase() || 'U' }}
          </div>
          <div class="umo-comment-author-info">
            <div class="umo-comment-author-name">
              {{ currentUser?.name || t('comment.anonymous') }}
            </div>
          </div>
        </div>
      </div>
      <div class="umo-comment-selected-text" v-if="selectedText">
        <div class="umo-comment-label">{{ t('comment.selectedText') }}:</div>
        <div class="umo-comment-text-content">{{ selectedText }}</div>
      </div>
      <t-textarea
        v-model="commentContent"
        :placeholder="t('comment.inputPlaceholder')"
        :autosize="{ minRows: 4, maxRows: 8 }"
        maxlength="500"
        show-limit-number
        autofocus
      />
    </div>
  </modal>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    visible: boolean
    selectedText: string
    currentUser?: {
      id: string
      name: string
      avatar?: string
    }
    isEdit?: boolean
    initialContent?: string
  }>(),
  {
    currentUser: () => ({
      id: 'default-user',
      name: '默认用户',
    }),
  },
)

const emit = defineEmits<{
  confirm: [content: string]
  close: []
}>()

const commentContent = ref(props.initialContent || '')

watch(
  () => props.visible,
  (val) => {
    if (val) {
      commentContent.value = props.initialContent || ''
    }
  },
)

const handleConfirm = () => {
  if (!commentContent.value.trim()) {
    useMessage('warning', {
      content: t('comment.contentRequired'),
    })
    return
  }
  emit('confirm', commentContent.value)
  commentContent.value = ''
}

const handleClose = () => {
  emit('close')
  commentContent.value = ''
}
</script>

<style lang="less" scoped>
.umo-comment-dialog {
  padding: 8px 0;

  .umo-comment-dialog-info {
    margin-bottom: 16px;

    .umo-comment-author {
      display: flex;
      align-items: center;
      gap: 10px;

      .umo-comment-avatar,
      .umo-comment-avatar-placeholder {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .umo-comment-avatar {
        object-fit: cover;
      }

      .umo-comment-avatar-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--umo-primary-color);
        color: #fff;
        font-size: 16px;
        font-weight: 600;
      }

      .umo-comment-author-info {
        flex: 1;

        .umo-comment-author-name {
          font-size: 15px;
          font-weight: 500;
          color: var(--umo-text-color);
        }
      }
    }
  }

  .umo-comment-selected-text {
    margin-bottom: 16px;
    padding: 12px;
    background-color: var(--umo-color-white-dark);
    border-radius: 6px;
    border: 1px solid var(--umo-border-color-light);

    .umo-comment-label {
      font-size: 12px;
      color: var(--umo-text-color-light);
      margin-bottom: 6px;
    }

    .umo-comment-text-content {
      font-size: 14px;
      color: var(--umo-text-color);
      line-height: 1.6;
      max-height: 100px;
      overflow-y: auto;
      word-break: break-word;
    }
  }
}

[data-theme='dark'] {
  .umo-comment-dialog {
    .umo-comment-selected-text {
      background-color: var(--umo-color-dark-light);
      border-color: var(--umo-border-color-dark);
    }
  }
}
</style>
