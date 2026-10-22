import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ROLES: { value: UserType; label: string }[] = [
  { value: 'viewer', label: 'can view' },
  { value: 'editor', label: 'can edit' },
];

/** "can view" / "can edit" picker; `onClickHandler` fires after the choice is applied. */
export default function UserTypeSelector({ userType, setUserType, onClickHandler }: UserTypeSelectorParams) {
  const choose = (role: UserType) => {
    setUserType(role);
    onClickHandler?.(role);
  };

  return (
    <Select value={userType} onValueChange={choose}>
      <SelectTrigger className="shad-select" aria-label="Access level">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="border-none bg-dark-200">
        {ROLES.map((role) => (
          <SelectItem key={role.value} value={role.value} className="shad-select-item">
            {role.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
