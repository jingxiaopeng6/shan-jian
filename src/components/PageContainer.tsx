import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
}

/** 内容区标准容器：限制最大宽度 + 移动端优先 padding */
export default function PageContainer({ children, className = '' }: Props) {
  return <div className={`max-w-3xl mx-auto px-4 py-5 sm:py-8 ${className}`}>{children}</div>
}
