/**
 * Psychi Mobile App Icons
 * Premium thin line icons using Phosphor Icons (Light weight)
 * Elegant, artistic, and intentional design
 */

import React from 'react';
import {
  House,
  ChatCircle,
  User,
  GearSix,
  Bell,
  MagnifyingGlass,
  List,
  Heart,
  CalendarBlank,
  X,
  Plus,
  Check,
  Star,
  PencilSimple,
  Trash,
  PaperPlaneTilt,
  Upload,
  Download,
  ArrowsClockwise,
  Funnel,
  Play,
  Pause,
  CaretDown,
  CaretLeft,
  CaretRight,
  CaretUp,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Warning,
  Info,
  Question,
  CheckCircle,
  Phone,
  PhoneSlash,
  Microphone,
  MicrophoneSlash,
  VideoCamera,
  VideoCameraSlash,
  Envelope,
  Users,
  ChartBar,
  CreditCard,
  BookOpen,
  CurrencyDollar,
  Folder,
  Eye,
  EyeSlash,
  Clock,
  Camera,
  Lock,
  Shield,
  Globe,
  SignOut,
  DotOutline,
  DotsSix,
  DotsThree,
  Columns,
  Sparkle,
  WarningCircle,
  Headset,
  MapPin,
  Certificate,
  Handshake,
  Brain,
  Leaf,
  Sun,
  Moon,
  ChatTeardropText,
  UserCircle,
  Sliders,
  Export,
  Wallet,
  Bank,
  Receipt,
  Lightning,
  Flag,
  ShieldCheck,
  XCircle,
  MinusCircle,
  PlusCircle,
  Copy,
  Share,
  Paperclip,
  Image,
  File,
  FileText,
  FolderOpen,
  ClockCounterClockwise,
  At,
  Hash,
  Link,
  ArrowSquareOut,
  Clipboard,
  Lightbulb,
  WarningOctagon,
  FileDoc,
  ArrowsLeftRight,
  HandWaving,
  MaskHappy,
  Prohibit,
  SmileySad,
  WifiSlash,
  SpeakerHigh,
  SpeakerLow,
} from 'phosphor-react-native';
import type { IconProps as PhosphorIconProps } from 'phosphor-react-native';

// Default icon configuration for consistent styling
const DEFAULT_SIZE = 24;
const DEFAULT_COLOR = '#718096';
const DEFAULT_WEIGHT: PhosphorIconProps['weight'] = 'light';

interface IconProps {
  size?: number;
  color?: string;
  weight?: PhosphorIconProps['weight'];
}

// =============================================================================
// NAVIGATION ICONS
// =============================================================================

export const HomeIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <House size={size} color={color} weight={weight} />;

export const ChatIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <ChatCircle size={size} color={color} weight={weight} />;

export const VideoIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <VideoCamera size={size} color={color} weight={weight} />;

export const ProfileIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <User size={size} color={color} weight={weight} />;

export const SettingsIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <GearSix size={size} color={color} weight={weight} />;

export const NotificationsIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Bell size={size} color={color} weight={weight} />;

export const SearchIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <MagnifyingGlass size={size} color={color} weight={weight} />;

export const MenuIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <List size={size} color={color} weight={weight} />;

// =============================================================================
// ACTION ICONS
// =============================================================================

export const HeartIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Heart size={size} color={color} weight={weight} />;

export const CalendarIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <CalendarBlank size={size} color={color} weight={weight} />;

export const CloseIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <X size={size} color={color} weight={weight} />;

export const PlusIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Plus size={size} color={color} weight={weight} />;

export const CheckIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Check size={size} color={color} weight={weight} />;

export const StarIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Star size={size} color={color} weight={weight} />;

export const EditIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <PencilSimple size={size} color={color} weight={weight} />;

export const TrashIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Trash size={size} color={color} weight={weight} />;

export const SendIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <PaperPlaneTilt size={size} color={color} weight={weight} />;

export const UploadIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Upload size={size} color={color} weight={weight} />;

export const DownloadIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Download size={size} color={color} weight={weight} />;

export const RefreshIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <ArrowsClockwise size={size} color={color} weight={weight} />;

export const FilterIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Funnel size={size} color={color} weight={weight} />;

export const PlayIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Play size={size} color={color} weight={weight} />;

export const PauseIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Pause size={size} color={color} weight={weight} />;

// =============================================================================
// CHEVRON / ARROW ICONS
// =============================================================================

export const ChevronDownIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <CaretDown size={size} color={color} weight={weight} />;

export const ChevronLeftIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <CaretLeft size={size} color={color} weight={weight} />;

export const ChevronRightIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <CaretRight size={size} color={color} weight={weight} />;

export const ChevronUpIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <CaretUp size={size} color={color} weight={weight} />;

export const ArrowRightIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <ArrowRight size={size} color={color} weight={weight} />;

export const ArrowLeftIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <ArrowLeft size={size} color={color} weight={weight} />;

export const ArrowUpIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <ArrowUp size={size} color={color} weight={weight} />;

export const ArrowDownIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <ArrowDown size={size} color={color} weight={weight} />;

// =============================================================================
// STATUS ICONS
// =============================================================================

export const WarningIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Warning size={size} color={color} weight={weight} />;

export const InfoIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Info size={size} color={color} weight={weight} />;

export const HelpIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Question size={size} color={color} weight={weight} />;

export const CheckCircleIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <CheckCircle size={size} color={color} weight={weight} />;

export const AlertIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <WarningCircle size={size} color={color} weight={weight} />;

export const ErrorCircleIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <XCircle size={size} color={color} weight={weight} />;

// =============================================================================
// COMMUNICATION ICONS
// =============================================================================

export const PhoneIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Phone size={size} color={color} weight={weight} />;

export const PhoneOffIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <PhoneSlash size={size} color={color} weight={weight} />;

export const MicIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Microphone size={size} color={color} weight={weight} />;

export const MicOffIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <MicrophoneSlash size={size} color={color} weight={weight} />;

export const VideoOffIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <VideoCameraSlash size={size} color={color} weight={weight} />;

export const MailIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Envelope size={size} color={color} weight={weight} />;

export const HeadsetIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Headset size={size} color={color} weight={weight} />;

export const MessageIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <ChatTeardropText size={size} color={color} weight={weight} />;

// =============================================================================
// DATA / CONTENT ICONS
// =============================================================================

export const UsersIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Users size={size} color={color} weight={weight} />;

export const ChartIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <ChartBar size={size} color={color} weight={weight} />;

export const CardIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <CreditCard size={size} color={color} weight={weight} />;

export const BookIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <BookOpen size={size} color={color} weight={weight} />;

export const DollarIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <CurrencyDollar size={size} color={color} weight={weight} />;

export const FolderIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Folder size={size} color={color} weight={weight} />;

export const EyeIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Eye size={size} color={color} weight={weight} />;

export const EyeOffIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <EyeSlash size={size} color={color} weight={weight} />;

export const ClockIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Clock size={size} color={color} weight={weight} />;

export const CameraIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Camera size={size} color={color} weight={weight} />;

export const WalletIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Wallet size={size} color={color} weight={weight} />;

export const BankIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Bank size={size} color={color} weight={weight} />;

export const ReceiptIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Receipt size={size} color={color} weight={weight} />;

// =============================================================================
// SECURITY / SYSTEM ICONS
// =============================================================================

export const LockIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Lock size={size} color={color} weight={weight} />;

export const ShieldIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Shield size={size} color={color} weight={weight} />;

export const ShieldCheckIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <ShieldCheck size={size} color={color} weight={weight} />;

export const GlobeIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Globe size={size} color={color} weight={weight} />;

export const LogoutIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <SignOut size={size} color={color} weight={weight} />;

export const FlagIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Flag size={size} color={color} weight={weight} />;

// =============================================================================
// UI COMPONENT ICONS
// =============================================================================

export const DotIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <DotOutline size={size} color={color} weight="fill" />;

export const GripIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <DotsSix size={size} color={color} weight={weight} />;

export const MoreHorizontalIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <DotsThree size={size} color={color} weight={weight} />;

export const PanelIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Columns size={size} color={color} weight={weight} />;

export const SparkleIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Sparkle size={size} color={color} weight={weight} />;

export const SlidersIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Sliders size={size} color={color} weight={weight} />;

export const ExportIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Export size={size} color={color} weight={weight} />;

export const LightningIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Lightning size={size} color={color} weight={weight} />;

// =============================================================================
// PSYCHI-SPECIFIC ICONS (Mental health themed)
// =============================================================================

export const LocationIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <MapPin size={size} color={color} weight={weight} />;

export const CertificateIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Certificate size={size} color={color} weight={weight} />;

export const HandshakeIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Handshake size={size} color={color} weight={weight} />;

export const BrainIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Brain size={size} color={color} weight={weight} />;

export const LeafIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Leaf size={size} color={color} weight={weight} />;

export const SunIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Sun size={size} color={color} weight={weight} />;

export const MoonIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Moon size={size} color={color} weight={weight} />;

export const UserCircleIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <UserCircle size={size} color={color} weight={weight} />;

// =============================================================================
// ADDITIONAL UTILITY ICONS
// =============================================================================

export const MinusCircleIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <MinusCircle size={size} color={color} weight={weight} />;

export const PlusCircleIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <PlusCircle size={size} color={color} weight={weight} />;

export const CopyIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Copy size={size} color={color} weight={weight} />;

export const ShareIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Share size={size} color={color} weight={weight} />;

export const AttachmentIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Paperclip size={size} color={color} weight={weight} />;

export const ImageIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Image size={size} color={color} weight={weight} />;

export const FileIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <File size={size} color={color} weight={weight} />;

export const FileTextIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <FileText size={size} color={color} weight={weight} />;

export const FolderOpenIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <FolderOpen size={size} color={color} weight={weight} />;

export const HistoryIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <ClockCounterClockwise size={size} color={color} weight={weight} />;

export const AtIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <At size={size} color={color} weight={weight} />;

export const HashIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Hash size={size} color={color} weight={weight} />;

export const LinkIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Link size={size} color={color} weight={weight} />;

export const ExternalLinkIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <ArrowSquareOut size={size} color={color} weight={weight} />;

// Additional icons for backwards compatibility
export const ClipboardIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Clipboard size={size} color={color} weight={weight} />;

export const LightbulbIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Lightbulb size={size} color={color} weight={weight} />;

export const AlertTriangleIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <WarningOctagon size={size} color={color} weight={weight} />;

export const DocumentIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <FileDoc size={size} color={color} weight={weight} />;

// =============================================================================
// ADDITIONAL ICONS (Added for emoji replacement)
// =============================================================================

export const CreditCardIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <CreditCard size={size} color={color} weight={weight} />;

export const ArrowLeftRightIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <ArrowsLeftRight size={size} color={color} weight={weight} />;

export const HandWaveIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <HandWaving size={size} color={color} weight={weight} />;

export const MaskIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <MaskHappy size={size} color={color} weight={weight} />;

export const BlockIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <Prohibit size={size} color={color} weight={weight} />;

export const SadFaceIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <SmileySad size={size} color={color} weight={weight} />;

export const WifiOffIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <WifiSlash size={size} color={color} weight={weight} />;

export const VolumeHighIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <SpeakerHigh size={size} color={color} weight={weight} />;

export const VolumeLowIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  weight = DEFAULT_WEIGHT
}) => <SpeakerLow size={size} color={color} weight={weight} />;

// Export the IconProps type for use in other components
export type { IconProps };
