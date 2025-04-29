import React from "react";

export type IconProps = {
  /**
   * The class name to apply to the icon
   * @example "h-4 w-4"
   */
  className?: string;
  /**
   * The color to apply to the icon
   * @example "text-gray-500"
   */
  color?: string;
};

export type IconComponent = React.FC<IconProps>;
