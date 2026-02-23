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
import { Plus, DollarSign, Minus, ShoppingCart, Store } from "lucide-react";
import { CATEGORY_CONFIG } from "@/lib/constants";
import { GROCERY_CATALOG, STORE_LABELS, GROCERY_CATEGORY_LABELS, type GroceryItem } from "@/lib/grocery-catalog";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CreateTaskDialogProps {
  onSubmit: (data: InsertTask) => void;
  isPending: boolean;
}

export function CreateTaskDialog({ onSubmit, isPending }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Map<string, GroceryItemSelection>>(new Map());
  const [storeFilter, setStoreFilter] = useState<"all" | "trader_joes" | "target">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const form = useForm<InsertTask>({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "grocery_shopping",
      budget: CATEGORY_CONFIG.grocery_shopping.price,
      location: "",
    },
  });

  const selectedCategory = form.watch("category") as TaskCategory;
  const currentPrice = CATEGORY_CONFIG[selectedCategory]?.price ?? 25;
  const isGrocery = selectedCategory === "grocery_shopping";

  function handleCategoryChange(value: string, onChange: (value: string) => void) {
    onChange(value);
    const cat = value as TaskCategory;
    form.setValue("budget", CATEGORY_CONFIG[cat].price);
    if (value !== "grocery_shopping") {
      setSelectedItems(new Map());
    }
  }

  function addItem(item: GroceryItem) {
    setSelectedItems((prev) => {
      const next = new Map(prev);
      const existing = next.get(item.id);
      if (existing) {
        next.set(item.id, { ...existing, quantity: existing.quantity + 1 });
      } else {
        next.set(item.id, { id: item.id, name: item.name, price: item.price, store: item.store, quantity: 1 });
      }
      return next;
    });
  }

  function removeItem(itemId: string) {
    setSelectedItems((prev) => {
      const next = new Map(prev);
      const existing = next.get(itemId);
      if (existing && existing.quantity > 1) {
        next.set(itemId, { ...existing, quantity: existing.quantity - 1 });
      } else {
        next.delete(itemId);
      }
      return next;
    });
  }

  const itemsTotal = Array.from(selectedItems.values()).reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = Array.from(selectedItems.values()).reduce((sum, item) => sum + item.quantity, 0);

  const filteredCatalog = GROCERY_CATALOG.filter((item) => {
    if (storeFilter !== "all" && item.store !== storeFilter) return false;
    if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
    return true;
  });

  const groupedCatalog = filteredCatalog.reduce<Record<string, GroceryItem[]>>((acc, item) => {
    const key = item.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  function handleSubmit(data: InsertTask) {
    const groceryItemsArray = isGrocery ? Array.from(selectedItems.values()) : undefined;
    const finalData = {
      ...data,
      budget: CATEGORY_CONFIG[data.category as TaskCategory].price,
      groceryItems: groceryItemsArray && groceryItemsArray.length > 0 ? groceryItemsArray : undefined,
    };
    onSubmit(finalData);
    form.reset();
    setSelectedItems(new Map());
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setSelectedItems(new Map()); } }}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-task">
          <Plus className="w-4 h-4 mr-2" />
          Post a Task
        </Button>
      </DialogTrigger>
      <DialogContent className={isGrocery ? "sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" : "sm:max-w-md"}>
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
              {isGrocery && itemCount > 0 && (
                <>
                  <span className="text-sm text-muted-foreground ml-2">+ Items:</span>
                  <span className="font-bold text-lg">${itemsTotal.toFixed(2)}</span>
                </>
              )}
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

            {isGrocery && (
              <div className="flex-1 overflow-hidden flex flex-col space-y-3 border rounded-md p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-sm">Select Grocery Items</span>
                  </div>
                  {itemCount > 0 && (
                    <Badge variant="secondary" data-testid="badge-item-count">
                      {itemCount} item{itemCount !== 1 ? "s" : ""} · ${itemsTotal.toFixed(2)}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={storeFilter} onValueChange={(v) => setStoreFilter(v as any)}>
                    <SelectTrigger className="w-[140px] h-8 text-xs" data-testid="select-store-filter">
                      <Store className="w-3 h-3 mr-1" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stores</SelectItem>
                      <SelectItem value="trader_joes">Trader Joe's</SelectItem>
                      <SelectItem value="target">Target</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[140px] h-8 text-xs" data-testid="select-category-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {Object.entries(GROCERY_CATEGORY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedItems.size > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(selectedItems.values()).map((item) => (
                      <Badge
                        key={item.id}
                        variant="outline"
                        className="text-xs cursor-pointer hover:bg-destructive/10"
                        onClick={() => removeItem(item.id)}
                        data-testid={`badge-selected-${item.id}`}
                      >
                        {item.name} ×{item.quantity} (${(item.price * item.quantity).toFixed(2)})
                        <Minus className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}

                <ScrollArea className="flex-1 max-h-[200px]">
                  <div className="space-y-3 pr-3">
                    {Object.entries(groupedCatalog).map(([cat, items]) => (
                      <div key={cat}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                          {GROCERY_CATEGORY_LABELS[cat] ?? cat}
                        </p>
                        <div className="space-y-1">
                          {items.map((item) => {
                            const selected = selectedItems.get(item.id);
                            return (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 group cursor-pointer"
                                onClick={() => addItem(item)}
                                data-testid={`grocery-item-${item.id}`}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <span className="text-sm truncate">{item.name}</span>
                                  <Badge variant="outline" className="text-[10px] shrink-0">
                                    {STORE_LABELS[item.store]}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-sm font-medium">${item.price.toFixed(2)}</span>
                                  {selected ? (
                                    <div className="flex items-center gap-1">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="w-6 h-6"
                                        onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                                        data-testid={`button-remove-${item.id}`}
                                      >
                                        <Minus className="w-3 h-3" />
                                      </Button>
                                      <span className="text-xs font-bold w-4 text-center">{selected.quantity}</span>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="w-6 h-6"
                                        onClick={(e) => { e.stopPropagation(); addItem(item); }}
                                        data-testid={`button-add-${item.id}`}
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="w-6 h-6 opacity-0 group-hover:opacity-100"
                                      data-testid={`button-add-${item.id}`}
                                    >
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

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
