interface HomeScreenProps {
  hasDraft: boolean
  canInstall: boolean
  onImport: () => void
  onBlankCanvas: () => void
  onContinue: () => void
  onFonts: () => void
  onHelp: () => void
  onAbout: () => void
  onInstall: () => void
  onClearDraft: () => void
}

export function HomeScreen({
  hasDraft,
  canInstall,
  onImport,
  onBlankCanvas,
  onContinue,
  onFonts,
  onHelp,
  onAbout,
  onInstall,
  onClearDraft,
}: HomeScreenProps) {
  return (
    <div className="screen">
      <header className="home-header">
        <h1 className="home-title">毛毡排字助手</h1>
        <p className="home-subtitle">导入图片，添加名字，调整后保存</p>
      </header>

      <div className="home-actions">
        <button className="btn btn-primary btn-lg btn-block" onClick={onImport}>
          导入产品图片
        </button>

        <button className="btn btn-lg btn-block" onClick={onBlankCanvas}>
          白底排字（免导入图片）
        </button>

        {hasDraft && (
          <button className="btn btn-lg btn-block" onClick={onContinue}>
            继续上次编辑
          </button>
        )}
        {hasDraft && (
          <button className="btn btn-danger btn-block" onClick={onClearDraft}>
            清除草稿
          </button>
        )}

        <button className="btn btn-lg btn-block" onClick={onFonts}>
          字体管理
        </button>

        <button className="btn btn-lg btn-block" onClick={onHelp}>
          使用说明
        </button>

        {canInstall && (
          <button className="btn btn-block" onClick={onInstall}>
            安装到手机桌面
          </button>
        )}
      </div>

      <footer className="home-footer">
        <button className="btn" onClick={onAbout} style={{ minHeight: 40 }}>
          关于与隐私
        </button>
        <p style={{ marginTop: 12 }}>完全本地运行 · 无需联网 · 无广告</p>
      </footer>
    </div>
  )
}
