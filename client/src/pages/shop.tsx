import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Search, ShoppingCart, Plus, Minus, Trash2, ArrowLeft, MapPin,
  ChevronRight, Store, X, CheckCircle, Zap, LogOut,
} from "lucide-react";
import { Link } from "wouter";
import {
  GROCERY_CATALOG, STORE_INFO, GROCERY_CATEGORY_CONFIG, STORE_LABELS,
  type GroceryItem,
} from "@/lib/grocery-catalog";
import type { GroceryItemSelection, PaymentMethod } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PaymentMethodSelector, { getPaymentMethodLabel } from "@/components/payment-method-selector";

type CartItem = GroceryItemSelection;

export default function ShopPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [selectedStore, setSelectedStore] = useState<"trader_joes" | "target" | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  const storeItems = useMemo(() => {
    if (!selectedStore) return [];
    return GROCERY_CATALOG.filter((item) => item.store === selectedStore);
  }, [selectedStore]);

  const categories = useMemo(() => {
    const cats = new Set(storeItems.map((item) => item.category));
    return Array.from(cats);
  }, [storeItems]);

  const filteredItems = useMemo(() => {
    let items = storeItems;
    if (selectedCategory !== "all") {
      items = items.filter((item) => item.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((item) => item.name.toLowerCase().includes(q));
    }
    return items;
  }, [storeItems, selectedCategory, searchQuery]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, GroceryItem[]> = {};
    for (const item of filteredItems) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [filteredItems]);

  const cartItems = Array.from(cart.values());
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const serviceCharge = Math.round(cartTotal * 0.10 * 100) / 100;
  const deliveryFee = Math.round(cartTotal * 0.15 * 100) / 100;
  const totalFees = serviceCharge + deliveryFee;
  const orderTotal = cartTotal + totalFees;

  function addToCart(item: GroceryItem) {
    setCart((prev) => {
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

  function removeFromCart(itemId: string) {
    setCart((prev) => {
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

  function deleteFromCart(itemId: string) {
    setCart((prev) => {
      const next = new Map(prev);
      next.delete(itemId);
      return next;
    });
  }

  const getItemQuantity = (itemId: string) => cart.get(itemId)?.quantity ?? 0;

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const storeName = selectedStore ? STORE_INFO[selectedStore].name : "Grocery Store";
      const res = await apiRequest("POST", "/api/tasks", {
        title: `${storeName} delivery to ${deliveryLocation}`,
        description: `Grocery delivery from ${storeName} at USC Village. ${deliveryNotes ? `Notes: ${deliveryNotes}` : ""}`.trim(),
        category: "grocery_shopping",
        budget: Math.round(orderTotal * 100) / 100,
        location: deliveryLocation,
        groceryItems: cartItems,
        paymentMethod: paymentMethod,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Order placed!", description: "Your grocery order has been posted. A Tasker will pick it up soon." });
      setCart(new Map());
      setCheckoutOpen(false);
      setDeliveryLocation("");
      setDeliveryNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my/posted"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to place order. Please try again.", variant: "destructive" });
    },
  });

  if (!selectedStore) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-white dark:bg-card sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg" data-testid="text-brand">TaskForce</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="outline" size="sm" data-testid="button-back-home">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              {user && (
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.profileImageUrl ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {(user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center space-y-3 mb-10">
            <h1 className="text-3xl font-bold" data-testid="text-shop-title">USC Village Grocery</h1>
            <p className="text-muted-foreground text-lg">Choose a store to start shopping. A fellow Trojan will pick up and deliver your order.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {(Object.entries(STORE_INFO) as [string, typeof STORE_INFO[string]][]).map(([storeId, info]) => {
              const itemCount = GROCERY_CATALOG.filter((i) => i.store === storeId).length;
              return (
                <Card
                  key={storeId}
                  className="hover-elevate cursor-pointer group overflow-hidden"
                  onClick={() => setSelectedStore(storeId as "trader_joes" | "target")}
                  data-testid={`card-store-${storeId}`}
                >
                  <CardContent className="p-0">
                    <div className={`h-32 flex items-center justify-center ${storeId === "trader_joes" ? "bg-gradient-to-br from-red-700 to-red-900" : "bg-gradient-to-br from-red-500 to-red-700"}`}>
                      <div className="text-center text-white">
                        <Store className="w-10 h-10 mx-auto mb-2 opacity-90" />
                        <h2 className="text-2xl font-bold">{info.name}</h2>
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      <p className="text-sm text-muted-foreground italic">{info.tagline}</p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        {info.location}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{itemCount} items available</Badge>
                        <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                          Shop now <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm text-muted-foreground">
              <ShoppingCart className="w-4 h-4" />
              10% service charge + 15% delivery fee · Delivery to any USC dorm or building
            </div>
          </div>
        </main>
      </div>
    );
  }

  const storeInfo = STORE_INFO[selectedStore];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-white dark:bg-card sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center gap-4">
          <button
            onClick={() => { setSelectedStore(null); setSelectedCategory("all"); setSearchQuery(""); }}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity shrink-0"
            data-testid="button-back-stores"
          >
            <ArrowLeft className="w-4 h-4" />
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <span className="font-bold text-sm">{storeInfo.name}</span>
            <Badge variant="outline" className="text-[10px]">USC Village</Badge>
          </div>

          <div className="flex-1 max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${storeInfo.name}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
                data-testid="input-search"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="relative" data-testid="button-cart">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Cart
                  {cartCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]" data-testid="badge-cart-count">
                      {cartCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md flex flex-col">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Your Cart
                    {cartCount > 0 && <Badge variant="secondary">{cartCount} items</Badge>}
                  </SheetTitle>
                </SheetHeader>
                {cartItems.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-muted-foreground space-y-2">
                      <ShoppingCart className="w-12 h-12 mx-auto opacity-30" />
                      <p className="font-medium">Your cart is empty</p>
                      <p className="text-sm">Start adding items to your cart</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <ScrollArea className="flex-1 -mx-6 px-6">
                      <div className="space-y-3 py-4">
                        {cartItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30" data-testid={`cart-item-${item.id}`}>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{STORE_LABELS[item.store]} · ${item.price.toFixed(2)} each</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Button variant="outline" size="icon" className="w-7 h-7" onClick={() => removeFromCart(item.id)} data-testid={`button-cart-minus-${item.id}`}>
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                              <Button variant="outline" size="icon" className="w-7 h-7" onClick={() => addToCart(GROCERY_CATALOG.find((i) => i.id === item.id)!)} data-testid={`button-cart-plus-${item.id}`}>
                                <Plus className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive" onClick={() => deleteFromCart(item.id)} data-testid={`button-cart-delete-${item.id}`}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                            <span className="text-sm font-bold w-14 text-right shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="border-t pt-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Items subtotal</span>
                        <span className="font-medium" data-testid="text-subtotal">${cartTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Service charge (10%)</span>
                        <span className="font-medium">${serviceCharge.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Delivery fee (15%)</span>
                        <span className="font-medium">${deliveryFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-base font-bold border-t pt-2">
                        <span>Total</span>
                        <span data-testid="text-cart-total">${orderTotal.toFixed(2)}</span>
                      </div>
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}
                        data-testid="button-checkout"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Checkout · ${orderTotal.toFixed(2)}
                      </Button>
                    </div>
                  </>
                )}
              </SheetContent>
            </Sheet>

            {user && (
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.profileImageUrl ?? undefined} />
                <AvatarFallback className="text-xs">
                  {(user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-[1400px] mx-auto w-full">
        <aside className="w-52 shrink-0 border-r bg-muted/20 hidden md:block">
          <nav className="sticky top-14 p-3 space-y-1">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedCategory === "all" ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted"}`}
              data-testid="category-all"
            >
              All Items
            </button>
            {categories.map((cat) => {
              const config = GROCERY_CATEGORY_CONFIG[cat];
              if (!config) return null;
              const count = storeItems.filter((i) => i.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${selectedCategory === cat ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted"}`}
                  data-testid={`category-${cat}`}
                >
                  <span className="flex items-center gap-2">
                    <span>{config.emoji}</span>
                    <span>{config.label}</span>
                  </span>
                  <span className="text-xs opacity-60">{count}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="md:hidden flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4 scrollbar-hide">
            <Button
              size="sm"
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              className="shrink-0"
            >
              All
            </Button>
            {categories.map((cat) => {
              const config = GROCERY_CATEGORY_CONFIG[cat];
              if (!config) return null;
              return (
                <Button
                  key={cat}
                  size="sm"
                  variant={selectedCategory === cat ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat)}
                  className="shrink-0"
                >
                  {config.emoji} {config.label}
                </Button>
              );
            })}
          </div>

          {searchQuery && (
            <p className="text-sm text-muted-foreground mb-4">
              {filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""} for "{searchQuery}"
            </p>
          )}

          {filteredItems.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No items found</p>
              <p className="text-sm">Try a different search or category</p>
            </div>
          ) : selectedCategory === "all" ? (
            <div className="space-y-8">
              {Object.entries(groupedItems).map(([cat, items]) => {
                const config = GROCERY_CATEGORY_CONFIG[cat];
                return (
                  <section key={cat}>
                    <h2 className="text-lg font-bold mb-3 flex items-center gap-2" data-testid={`section-${cat}`}>
                      {config?.emoji} {config?.label ?? cat}
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {items.map((item) => (
                        <ProductCard key={item.id} item={item} quantity={getItemQuantity(item.id)} onAdd={() => addToCart(item)} onRemove={() => removeFromCart(item.id)} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                {GROCERY_CATEGORY_CONFIG[selectedCategory]?.emoji} {GROCERY_CATEGORY_CONFIG[selectedCategory]?.label}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredItems.map((item) => (
                  <ProductCard key={item.id} item={item} quantity={getItemQuantity(item.id)} onAdd={() => addToCart(item)} onRemove={() => removeFromCart(item.id)} />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {cartCount > 0 && !cartOpen && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 md:bottom-6">
          <Button
            size="lg"
            className="shadow-lg rounded-full px-6 gap-3"
            onClick={() => setCartOpen(true)}
            data-testid="button-floating-cart"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>View Cart ({cartCount})</span>
            <span className="font-bold">${orderTotal.toFixed(2)}</span>
          </Button>
        </div>
      )}

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Place Your Order
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>{cartCount} items from {storeInfo.name}</span>
                <span className="font-medium">${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Service charge (10%)</span>
                <span className="font-medium">${serviceCharge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Delivery fee (15%)</span>
                <span className="font-medium">${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Total</span>
                <span>${orderTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery-location">Delivery Location *</Label>
              <Input
                id="delivery-location"
                placeholder="e.g., McCarthy Hall, Room 215"
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value)}
                data-testid="input-delivery-location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery-notes">Notes for Tasker (optional)</Label>
              <Textarea
                id="delivery-notes"
                placeholder="Any special instructions? e.g., Text me when you arrive"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                className="resize-none"
                rows={2}
                data-testid="input-delivery-notes"
              />
            </div>

            <PaymentMethodSelector selected={paymentMethod} onSelect={setPaymentMethod} />

            <Button
              className="w-full"
              size="lg"
              disabled={!deliveryLocation.trim() || !paymentMethod || createOrderMutation.isPending}
              onClick={() => createOrderMutation.mutate()}
              data-testid="button-place-order"
            >
              {createOrderMutation.isPending ? "Placing Order..." : `Place Order · $${orderTotal.toFixed(2)}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductCard({ item, quantity, onAdd, onRemove }: {
  item: GroceryItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <Card className="overflow-hidden group hover:shadow-md transition-shadow" data-testid={`product-${item.id}`}>
      <CardContent className="p-0">
        <div className="h-24 bg-gradient-to-br from-muted/40 to-muted flex items-center justify-center text-4xl">
          {item.emoji}
        </div>
        <div className="p-3 space-y-2">
          <p className="text-sm font-medium leading-tight line-clamp-2 min-h-[2.5rem]" data-testid={`text-product-name-${item.id}`}>
            {item.name}
          </p>
          <div className="flex items-center justify-between">
            <span className="font-bold text-base" data-testid={`text-product-price-${item.id}`}>${item.price.toFixed(2)}</span>
            {quantity === 0 ? (
              <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full" onClick={onAdd} data-testid={`button-add-product-${item.id}`}>
                <Plus className="w-4 h-4" />
              </Button>
            ) : (
              <div className="flex items-center gap-1">
                <Button size="sm" variant="outline" className="h-7 w-7 p-0 rounded-full" onClick={onRemove} data-testid={`button-remove-product-${item.id}`}>
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="w-6 text-center text-sm font-bold" data-testid={`text-quantity-${item.id}`}>{quantity}</span>
                <Button size="sm" variant="outline" className="h-7 w-7 p-0 rounded-full" onClick={onAdd} data-testid={`button-add-product-${item.id}`}>
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
