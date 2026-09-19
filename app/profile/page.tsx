import { ProfileForm } from "@/components/profile/ProfileForm";
import { ProfileSnapshot } from "@/components/profile/ProfileSnapshot";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/Reveal";

export default function ProfilePage() {
  return (
    <Reveal>
      <div className="container-page max-w-2xl py-10">
        <PageHeader
          eyebrow="PROFILE"
          title="我的画像"
          subtitle="约 1 分钟完成 · 用于比赛推荐与队友匹配，且会自动同步到「队友匹配」页，无需重复填写。仅保存在本机，不上传。换网址时可用「导出画像 / 导入画像」一键迁移。"
        />
        <div className="mt-8 space-y-8">
          <ProfileSnapshot />
          <ProfileForm />
        </div>
      </div>
    </Reveal>
  );
}
