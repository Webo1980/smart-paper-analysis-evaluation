import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"

const RadioGroup = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className="grid gap-2"
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className="aspect-square h-4 w-4 rounded-full border border-gray-300 text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <div className="h-2.5 w-2.5 rounded-full bg-primary" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }