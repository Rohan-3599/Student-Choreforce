import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Camera, Loader2, Save } from "lucide-react";
import { USC_BUILDINGS, POPULAR_LANGUAGES } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [buildingName, setBuildingName] = useState(user?.building_name || "");
  const [genderPreference, setGenderPreference] = useState(user?.gender_preference || "");
  const [languages, setLanguages] = useState<string[]>(user?.languages || []);
  
  const [taskerBuildingName, setTaskerBuildingName] = useState(user?.taskerBuildingName || "");
  const [taskerGenderPreference, setTaskerGenderPreference] = useState(user?.taskerGenderPreference || "");
  const [taskerLanguages, setTaskerLanguages] = useState<string[]>(user?.taskerLanguages || []);

  const [profileImageUrl, setProfileImageUrl] = useState(user?.profileImageUrl || "");
  const [activeTab, setActiveTab] = useState("requester");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("tab") === "tasker") {
      setActiveTab("tasker");
    }
  }, []);

  // Sync state when user data loads
  useEffect(() => {
    if (user) {
      setBuildingName(user.building_name || "");
      setGenderPreference(user.gender_preference || "");
      setLanguages(user.languages || []);
      
      setTaskerBuildingName(user.taskerBuildingName || "");
      setTaskerGenderPreference(user.taskerGenderPreference || "");
      setTaskerLanguages(user.taskerLanguages || []);
      
      setProfileImageUrl(user.profileImageUrl || "");
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", "/api/auth/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Profile updated successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to update profile", variant: "destructive" });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Please upload an image smaller than 10MB", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const base64Image = event.target.result as string;
        setProfileImageUrl(base64Image);
        updateProfileMutation.mutate({ profileImageUrl: base64Image });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (activeTab === "requester") {
      updateProfileMutation.mutate({
        building_name: buildingName,
        gender_preference: genderPreference,
        languages: languages,
      });
    } else {
      updateProfileMutation.mutate({
        tasker_building_name: taskerBuildingName,
        tasker_gender_preference: taskerGenderPreference,
        tasker_languages: taskerLanguages,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={activeTab === "tasker" ? "/tasker" : "/"}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-bold text-lg">My Profile</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        <div className="flex flex-col items-center space-y-4 pt-4">
          <div className="relative group">
            <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
              <AvatarImage src={profileImageUrl || undefined} className="object-cover" />
              <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                {(user?.firstName?.[0] || "") + (user?.lastName?.[0] || "")}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full shadow-lg hover:scale-105 transition-transform"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold">{user?.firstName} {user?.lastName}</h2>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="bg-card rounded-xl border-2 border-primary/10 shadow-lg p-6 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full bg-accent/30 p-1">
              <TabsTrigger value="requester" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Requester Settings</TabsTrigger>
              {user?.isTaskerVerified && (
                <TabsTrigger value="tasker" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Tasker Settings</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="requester" className="space-y-6 pt-6">
              <ProfileSettingsFields 
                buildingName={buildingName} setBuildingName={setBuildingName}
                genderPreference={genderPreference} setGenderPreference={setGenderPreference}
                languages={languages} setLanguages={setLanguages}
                isTaskerTab={false}
              />
            </TabsContent>

            {user?.isTaskerVerified && (
              <TabsContent value="tasker" className="space-y-6 pt-6">
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 mb-6 font-geist">
                  <p className="text-sm font-bold text-primary">Tasker Mode Preferences</p>
                  <p className="text-xs text-muted-foreground mt-1">Configure how you appear to customers when you're working.</p>
                </div>
                <ProfileSettingsFields 
                  buildingName={taskerBuildingName} setBuildingName={setTaskerBuildingName}
                  genderPreference={taskerGenderPreference} setGenderPreference={setTaskerGenderPreference}
                  languages={taskerLanguages} setLanguages={setTaskerLanguages}
                  isTaskerTab={true}
                />
              </TabsContent>
            )}
          </Tabs>

          <div className="pt-4 flex justify-end border-t">
            <Button onClick={handleSave} disabled={updateProfileMutation.isPending} className="px-8 mt-4">
              {updateProfileMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

function ProfileSettingsFields({ 
  buildingName, setBuildingName, 
  genderPreference, setGenderPreference, 
  languages, setLanguages,
  isTaskerTab
}: any) {
  const toggleLanguage = (lang: string) => {
    setLanguages((prev: string[]) => 
      prev.includes(lang) 
        ? prev.filter(l => l !== lang)
        : [...prev, lang]
    );
  };

  return (
    <>
      <div className="space-y-3">
        <Label htmlFor="buildingName" className="text-sm font-semibold">
          {isTaskerTab ? "Preferred Work Location" : "Default Building Name (Location)"}
        </Label>
        <Select value={buildingName} onValueChange={setBuildingName}>
          <SelectTrigger className="bg-accent/40 border-primary/10">
            <SelectValue placeholder="Select building" />
          </SelectTrigger>
          <SelectContent>
            {USC_BUILDINGS.map((building) => (
              <SelectItem key={building} value={building}>
                {building}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground italic">
          {isTaskerTab 
            ? "Where you prefer to find tasks." 
            : "This is auto-filled for your new orders."}
        </p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="genderPreference" className="text-sm font-semibold">
          {isTaskerTab ? "Tasker Gender Category" : "Gender Preference for Tasker"}
        </Label>
        <Select value={genderPreference || "none"} onValueChange={(val) => setGenderPreference(val === "none" ? "" : val)}>
          <SelectTrigger className="bg-accent/40 border-primary/10 text-left h-10 px-3">
            <SelectValue placeholder="No Preference" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Preference</SelectItem>
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-semibold">
          {isTaskerTab ? "Languages you speak" : "Preferred Language for Tasker"}
        </Label>
        <div className="grid grid-cols-1 gap-3 pt-1">
          {POPULAR_LANGUAGES.map((lang) => (
            <div key={lang} className="flex items-center space-x-3 p-3 rounded-lg border border-primary/5 bg-accent/20 hover:bg-accent/30 transition-colors cursor-pointer" onClick={() => toggleLanguage(lang)}>
              <Checkbox 
                id={`${isTaskerTab ? 'tasker-' : 'req-'}${lang}`}
                checked={languages.includes(lang)}
                onCheckedChange={() => toggleLanguage(lang)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <label
                htmlFor={`${isTaskerTab ? 'tasker-' : 'req-'}${lang}`}
                className="text-sm font-medium leading-none cursor-pointer flex-1"
              >
                {lang}
              </label>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
