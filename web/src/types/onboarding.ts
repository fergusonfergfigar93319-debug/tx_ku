/** 单题字段（与 Android 问卷选项 id 对齐，仅合并为更少步骤展示） */
export interface OnboardingFieldJson {
  id: string
  title: string
  options: string[]
  multiSelect: boolean
}

export interface OnboardingStepJson {
  id: string
  title: string
  /** 步骤说明（可提示去资料页补充） */
  subtitle?: string
  fields: OnboardingFieldJson[]
}

export interface OnboardingQuestionsFile {
  steps: OnboardingStepJson[]
}
