
'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { VariantProps, cva } from 'class-variance-authority';
import { PanelLeft } from 'lucide-react';

import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const SIDEBAR_COOKIE_NAME = 'sidebar_state';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = '16rem';
const SIDEBAR_WIDTH_MOBILE = '18rem';
const SIDEBAR_WIDTH_ICON = '3rem'; // Reduced icon-only width
const SIDEBAR_KEYBOARD_SHORTCUT = 'b';

type SidebarContext = {
  state: 'expanded' | 'collapsed';
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
  side: 'left' | 'right'; // Add side to context
};

const SidebarContext = React.createContext<SidebarContext | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }

  return context;
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
     side?: 'left' | 'right'; // Allow setting side via provider
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      side = 'left', // Default side
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile();
    const [openMobile, setOpenMobile] = React.useState(false);
    const [isClient, setIsClient] = React.useState(false); // Track client-side mount

    // Track client-side mount to read cookie safely
    React.useEffect(() => {
      setIsClient(true);
    }, []);


    // Read initial state from cookie if available, only on client
    const getInitialOpenState = React.useCallback(() => {
      if (isClient) {
        const cookieValue = document.cookie
          .split('; ')
          .find((row) => row.startsWith(`${SIDEBAR_COOKIE_NAME}=`))
          ?.split('=')[1];
        if (cookieValue) {
          return cookieValue === 'true';
        }
      }
      return defaultOpen;
    }, [isClient, defaultOpen]);


     const [_open, _setOpen] = React.useState(getInitialOpenState);

    // Update state if cookie becomes available after initial render
    React.useEffect(() => {
      if (isClient) {
        _setOpen(getInitialOpenState());
      }
    }, [isClient, getInitialOpenState]);


    // This is the internal state of the sidebar.
    // We use openProp and setOpenProp for control from outside the component.
    const open = openProp ?? _open;
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === 'function' ? value(open) : value;
        if (setOpenProp) {
          setOpenProp(openState);
        } else {
          _setOpen(openState);
        }

        // This sets the cookie to keep the sidebar state.
        if (isClient) {
            document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}; SameSite=Lax`;
        }
      },
      [setOpenProp, open, isClient]
    );

    // Helper to toggle the sidebar.
    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((open) => !open)
        : setOpen((open) => !open);
    }, [isMobile, setOpen, setOpenMobile]);

    // Adds a keyboard shortcut to toggle the sidebar.
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault();
          toggleSidebar();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleSidebar]);

    // We add a state so that we can do data-state="expanded" or "collapsed".
    // This makes it easier to style the sidebar with Tailwind classes.
    const state = open ? 'expanded' : 'collapsed';

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
        side, // Provide side in context
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar, side]
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={100}> {/* Slightly longer delay for tooltips */}
          <div
            style={
              {
                '--sidebar-width': SIDEBAR_WIDTH,
                '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
                ...style,
              } as React.CSSProperties
            }
            className={cn(
              'group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar',
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    );
  }
);
SidebarProvider.displayName = 'SidebarProvider';

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    variant?: 'sidebar' | 'floating' | 'inset';
    collapsible?: 'offcanvas' | 'icon' | 'none';
  }
>(
  (
    {
      variant = 'sidebar',
      collapsible = 'icon', // Default to icon collapsible
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile, side } = useSidebar(); // Get side from context

    if (collapsible === 'none') {
      return (
        <div
          className={cn(
            'flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground shrink-0', // Added shrink-0
             side === "left" ? "border-r" : "border-l", // Add border based on side
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      );
    }

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className="w-[--sidebar-width] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden border-none" // Remove sheet border
             style={
              {
                '--sidebar-width': SIDEBAR_WIDTH_MOBILE,
              } as React.CSSProperties
            }
            side={side}
          >
            <div className="flex h-full w-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
             "group peer hidden md:block text-sidebar-foreground shrink-0", // Added shrink-0
             side === "left" ? "border-r" : "border-l" // Add border to the container div
            )}
        data-state={state}
        data-collapsible={state === 'collapsed' ? collapsible : ''}
        data-variant={variant}
        data-side={side}
      >
        {/* This is what handles the sidebar gap on desktop */}
        <div
          className={cn(
            'duration-200 relative h-svh bg-transparent transition-[width] ease-linear',
            state === "expanded" ? "w-[--sidebar-width]" : "", // Set width only when expanded
            "group-data-[collapsible=offcanvas]:w-0",
            variant === 'floating' || variant === 'inset'
              ? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)))]'
              : 'group-data-[collapsible=icon]:w-[--sidebar-width-icon]'
          )}
        />
        <div
          className={cn(
            'duration-200 fixed inset-y-0 z-10 hidden h-svh transition-[left,right,width] ease-linear md:flex',
             state === "expanded" ? "w-[--sidebar-width]" : "", // Set width only when expanded
            side === 'left'
              ? 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
              : 'right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
            // Adjust the padding for floating and inset variants.
            variant === 'floating' || variant === 'inset'
              ? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]'
               : 'group-data-[collapsible=icon]:w-[--sidebar-width-icon]', // Removed border here, applied to parent

            className
          )}
          {...props}
        >
          <div
            data-sidebar="sidebar"
            className={cn(
                 "flex h-full w-full flex-col bg-sidebar", // Removed border from here
                 "group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow"
                 )}
          >
            {children}
          </div>
        </div>
      </div>
    );
  }
);
Sidebar.displayName = 'Sidebar';

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn(
           "h-8 w-8", // Slightly smaller trigger
           "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground", // Style when sidebar is open (mobile only)
           className
        )}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeft className="h-5 w-5" /> {/* Slightly smaller icon */}
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
});
SidebarTrigger.displayName = 'SidebarTrigger';


const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'main'>
>(({ className, ...props }, ref) => {
    const { side } = useSidebar(); // Get side from context
  return (
    <main
      ref={ref}
      className={cn(
        'relative flex min-h-svh flex-1 flex-col bg-background',
        'peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow',
         // Adjust margin based on the sidebar side for inset variant
         side === 'right' ?
             'md:peer-data-[variant=inset]:mr-0 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:mr-2 md:peer-data-[variant=inset]:ml-2' :
             'md:peer-data-[variant=inset]:ml-0 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:mr-2',
        className
      )}
      {...props}
    />
  );
});
SidebarInset.displayName = 'SidebarInset';


const SidebarInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => {
    const { state } = useSidebar(); // Get state
  return (
    <Input
      ref={ref}
      data-sidebar="input"
      className={cn(
        'h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
        state === 'collapsed' && 'hidden', // Use state to hide
        className
      )}
      {...props}
    />
  );
});
SidebarInput.displayName = 'SidebarInput';


const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => {
    const { state } = useSidebar(); // Get state
  return (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn(
           "flex items-center gap-2 p-2 border-b border-sidebar-border", // Added border-b
           state === 'collapsed' && 'justify-center p-2', // Use state to center
           className)}
      {...props}
    />
  );
});
SidebarHeader.displayName = 'SidebarHeader';

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => {
    const { state } = useSidebar(); // Get state
  return (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn(
           "flex flex-col gap-2 p-2 mt-auto border-t border-sidebar-border", // Added mt-auto and border-t
           state === 'collapsed' && 'items-center', // Use state to center
           className)}
      {...props}
    />
  );
});
SidebarFooter.displayName = 'SidebarFooter';

const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
    const { state } = useSidebar(); // Get state
  return (
    <Separator
      ref={ref}
      data-sidebar="separator"
      className={cn(
           "mx-2 my-1 w-auto bg-sidebar-border", // Added margin-y
           state === 'collapsed' && 'mx-auto w-3/4', // Use state to adjust
           className
           )}
      {...props}
    />
  );
});
SidebarSeparator.displayName = 'SidebarSeparator';

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="content"
        className={cn(
          'flex min-h-0 flex-1 flex-col gap-1 p-2 overflow-y-auto overflow-x-hidden', // Adjusted padding and gap
          className
        )}
        {...props}
      />
    );
});
SidebarContent.displayName = 'SidebarContent';


const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<'ul'>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu"
    className={cn('flex w-full min-w-0 flex-col gap-1', className)}
    {...props}
  />
));
SidebarMenu.displayName = 'SidebarMenu';

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<'li'>
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn('group/menu-item relative', className)}
    {...props}
  />
));
SidebarMenuItem.displayName = 'SidebarMenuItem';

const sidebarMenuButtonVariants = cva(
  cn(
    'peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none transition-colors duration-100 ease-linear', // Base styles
    'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', // Focus styles
    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground', // Hover styles
    'active:bg-sidebar-accent active:text-sidebar-accent-foreground', // Active styles (click)
    'data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground', // Active item styles
    'disabled:pointer-events-none disabled:opacity-50', // Disabled styles
    'group-has-[[data-sidebar=menu-action]]/menu-item:pr-8', // Adjust padding if action exists
    // Collapsed state styles handled dynamically via context
    'group-data-[state=collapsed]:group-data-[collapsible=icon]:justify-center group-data-[state=collapsed]:group-data-[collapsible=icon]:size-8 group-data-[state=collapsed]:group-data-[collapsible=icon]:p-0',
    '[&>svg]:size-4 [&>svg]:shrink-0', // Icon styles
    '[&>span]:whitespace-nowrap [&>span]:truncate', // Text styles base
    // Text hiding handled dynamically via context
    '[&>span]:group-data-[state=collapsed]:group-data-[collapsible=icon]:hidden'
  ),
  {
    variants: {
      variant: {
        default: 'text-sidebar-foreground', // Default text color
        destructive:
          'text-destructive hover:bg-destructive/10 hover:text-destructive', // Destructive variant
      },
      size: { // Keep size variants if needed, but might be redundant with collapsed state
        default: 'h-8',
        sm: 'h-7 text-xs', // Example smaller size
        lg: 'h-10', // Example larger size
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);


const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement, // Allow button or anchor
  (React.ComponentProps<'button'> | React.ComponentProps<'a'>) & { // Union of props
    asChild?: boolean;
    isActive?: boolean;
    tooltip?: string | Omit<React.ComponentProps<typeof TooltipContent>, 'children'>; // Allow tooltip object props
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(
  (
    {
      asChild = false,
      isActive = false,
      variant = 'default',
      size = 'default',
      tooltip,
      className,
      children, // Ensure children are passed down
      ...props
    },
    ref
  ) => {
    const { isMobile, state, side, toggleSidebar } = useSidebar(); // Get sidebar state
    const Comp = asChild ? Slot : (props as any).href ? 'a' : 'button'; // Detect if it's a link

    const showTooltip = tooltip && state === 'collapsed' && !isMobile;

    const ButtonElement = (
      <Comp
        ref={ref as any} // Apply the ref here
        data-sidebar="menu-button"
        data-size={size}
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
        // Close mobile sidebar on click/link navigation
        onClick={(e) => {
          if (isMobile) {
            toggleSidebar(); // Close mobile sidebar
          }
          (props as any).onClick?.(e); // Call original onClick if exists
        }}
        {...props} // Spread original props (including href etc.)
      >
        {children} {/* Render children (icon, span) */}
      </Comp>
    );

    if (!showTooltip) {
      // Render directly if no tooltip needed
      return ButtonElement;
    }

    // Tooltip specific props
    const tooltipContentProps: Omit<React.ComponentProps<typeof TooltipContent>, 'children'> =
        typeof tooltip === 'string' ? {} : tooltip; // If tooltip is string, use default props

    // Wrap the ButtonElement with TooltipTrigger when tooltip is active
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                {ButtonElement}
            </TooltipTrigger>
            <TooltipContent
                side={side === 'right' ? 'left' : 'right'} // Adjust tooltip side based on sidebar side
                align="center"
                sideOffset={6} // Adjust offset
                {...tooltipContentProps} // Spread additional TooltipContent props
            >
                {typeof tooltip === 'string' ? tooltip : tooltip.children} {/* Handle string or object children */}
            </TooltipContent>
        </Tooltip>
    );
  }
);
SidebarMenuButton.displayName = 'SidebarMenuButton';


const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'> & {
    asChild?: boolean;
    showOnHover?: boolean;
  }
>(({ className, asChild = false, showOnHover = true, ...props }, ref) => { // Default showOnHover to true
  const Comp = asChild ? Slot : 'button';
    const { state } = useSidebar(); // Get state

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-action"
      className={cn(
        'absolute right-1 top-1/2 -translate-y-1/2 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-opacity hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
        state === 'collapsed' && 'hidden', // Use state to hide
         // Adjust based on parent button size if necessary
        'peer-data-[size=sm]/menu-button:top-[calc(50%-1px)]',
        'peer-data-[size=default]/menu-button:top-1/2',
        'peer-data-[size=lg]/menu-button:top-1/2',
        // Show on hover/focus logic
        showOnHover &&
          'opacity-0 group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100',
        className
      )}
      {...props}
    />
  );
});
SidebarMenuAction.displayName = 'SidebarMenuAction';


const SidebarMenuBadge = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, children, ...props }, ref) => { // Ensure children are passed
    const { state } = useSidebar(); // Get state
    return (
      <div
        ref={ref}
        data-sidebar="menu-badge"
        className={cn(
          'absolute right-2 top-1/2 -translate-y-1/2 flex h-5 min-w-5 items-center justify-center rounded-full bg-sidebar-primary px-1.5 text-[10px] font-medium tabular-nums text-sidebar-primary-foreground select-none pointer-events-none', // Use primary colors for badge
          state === 'collapsed' && 'hidden', // Use state to hide
           // Adjust vertical position based on parent button size if needed
          'peer-data-[size=sm]/menu-button:top-[calc(50%-1px)]',
          'peer-data-[size=default]/menu-button:top-1/2',
          'peer-data-[size=lg]/menu-button:top-1/2',
          className
        )}
        {...props}
      >
        {children} {/* Render badge content */}
        </div>
    );
});
SidebarMenuBadge.displayName = 'SidebarMenuBadge';


const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    showIcon?: boolean;
  }
>(({ className, showIcon = true, ...props }, ref) => { // Default showIcon to true
    const { state } = useSidebar(); // Get state
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  }, []);

  return (
    <div
      ref={ref}
      data-sidebar="menu-skeleton"
      className={cn(
           'rounded-md h-8 flex gap-2 px-2 items-center',
           state === 'collapsed' && 'justify-center size-8 p-0', // Adjust for collapsed state
           className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md shrink-0" // Added shrink-0
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 flex-1 max-w-[--skeleton-width]"
        data-sidebar="menu-skeleton-text"
         style={
          {
            '--skeleton-width': width,
            display: state === 'collapsed' ? 'none' : undefined, // Hide text skeleton when collapsed
          } as React.CSSProperties
        }
      />
    </div>
  );
});
SidebarMenuSkeleton.displayName = 'SidebarMenuSkeleton';


export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
};

export type { SidebarContext }; // Export context type if needed elsewhere

