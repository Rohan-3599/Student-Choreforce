import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema, type InsertTask, type TaskCategory, type GroceryItemSelection } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign } from "lucide-react";
import { CATEGORY_CONFIG } from "@/lib/constants";
import { useState } from "react";

interface CreateTaskDialogProps {
  onSubmit: (data: InsertTask) => void;
  isPending: boolean;
}

export function CreateTaskDialog({ onSubmit, isPending }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<InsertTask>({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "dorm_cleaning",
      budget: CATEGORY_CONFIG.dorm_cleaning.price,
      location: "",
    },
  });

  const selectedCategory = form.watch("category") as TaskCategory;
  const currentPrice = CATEGORY_CONFIG[selectedCategory]?.price ?? 25;

  function handleCategoryChange(value: string, onChange: (value: string) => void) {
    onChange(value);
    const cat = value as TaskCategory;
    form.setValue("budget", CATEGORY_CONFIG[cat].price);
  }


  function handleSubmit(data: InsertTask) {
    const finalData = {
      ...data,
      budget: CATEGORY_CONFIG[data.category as TaskCategory].price,
    };
    onSubmit(finalData);
    form.reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); }}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-task">
          <Plus className="w-4 h-4 mr-2" />
          Post a Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Post a New Task</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={(val) => handleCategoryChange(val, field.onChange)} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.entries(CATEGORY_CONFIG) as [TaskCategory, typeof CATEGORY_CONFIG[TaskCategory]][]).map(
                        ([key, config]) => {
                          const Icon = config.icon;
                          return (
                            <SelectItem key={key} value={key} data-testid={`option-${key}`}>
                              <div className="flex items-center gap-2">
                                <Icon className={`w-4 h-4 ${config.color}`} />
                                {config.label}
                              </div>
                            </SelectItem>
                          );
                        }
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Service fee:</span>
              <span className="font-bold text-lg" data-testid="text-set-price">${currentPrice}</span>
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Pick up groceries from Trader Joe's" {...field} data-testid="input-title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what needs to be done in detail..."
                      className="resize-none"
                      rows={2}
                      {...field}
                      data-testid="input-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., McCarthy Hall, Room 215" {...field} data-testid="input-location" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel-task">
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit-task">
                {isPending ? "Posting..." : "Post Task"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
